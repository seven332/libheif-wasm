import init, {
  heif_context,
  heif_error,
  heif_item_id,
  libheif,
} from "./libheif.js";

export interface HeifImage {
  width: number;
  height: number;
  data: Uint8Array;
}

export class HeifDecoder {
  private static promise: Promise<libheif> | undefined;

  /**
   * Creates a heif decoder from buffer.
   * Remember invoking `release` if you don't need
   * the buffer anymore, or memory leak in wasm.
   *
   * @param buffer a buffer contains a heif file
   * @returns the buffer to decode the heif file
   * @throws if it's not a heif file
   */
  static async from(
    buffer: ArrayBuffer | Uint8Array | Uint8ClampedArray | Int8Array
  ): Promise<HeifDecoder> {
    if (!HeifDecoder.promise) {
      HeifDecoder.promise = init();
    }
    const lib = await HeifDecoder.promise;
    const ctx = lib.heif_context_alloc();
    const error = lib.heif_context_read_from_memory(ctx, buffer);
    if (error.code != lib.heif_error_code.heif_error_Ok) {
      throw new Error(lib.heif_error_code[error.code]);
    }
    return new HeifDecoder(lib, ctx);
  }

  private constructor(private lib: libheif, private ctx: heif_context) {}

  /**
   * Returns the number of images.
   *
   * @returns the number of images
   * @throws if this decoder is released
   */
  getNumberOfImages(): number {
    this.checkReleased();
    return this.lib.heif_context_get_number_of_top_level_images(this.ctx);
  }

  /**
   * Returns the image at the index.
   *
   * @param index the index of the image
   * @returns the image at the index
   * @throws if this decoder is released, or it's not a heif file
   */
  decodeImage(index: number): HeifImage {
    this.checkReleased();
    const items = this.checkHeifError(
      this.lib.heif_js_context_get_list_of_top_level_image_IDs(this.ctx)
    );
    const id = items[index];
    if (!id) {
      throw new Error(`Only ${items.length} images but the index is ${index}`);
    }
    return this.decode(id);
  }

  /**
   * Returns all images.
   *
   * @returns all images
   * @throws if this decoder is released, or it's not a heif file
   */
  decodeAllImages(): HeifImage[] {
    this.checkReleased();
    return this.checkHeifError(
      this.lib.heif_js_context_get_list_of_top_level_image_IDs(this.ctx)
    ).map((id) => this.decode(id));
  }

  private decode(id: heif_item_id): HeifImage {
    const handle = this.checkHeifError(
      this.lib.heif_js_context_get_image_handle(this.ctx, id)
    );
    const image = this.checkHeifError(
      this.lib.heif_js_decode_image_rgba(handle)
    );
    const heifImage = {
      width: image.width,
      height: image.height,
      data: this.stridedCopy(
        image.plane,
        image.width * 4,
        image.height,
        image.stride
      ),
    };
    this.lib.heif_image_release(image.ptr);
    this.lib.heif_image_handle_release(handle);
    return heifImage;
  }

  private stridedCopy(
    src: Uint8Array,
    width: number,
    height: number,
    stride: number
  ): Uint8Array {
    const dst = new Uint8Array(width * height);
    if (width == stride) {
      dst.set(src);
    } else {
      let dstOffset = 0;
      let srcOffset = 0;
      for (let y = 0; y < height; ++y) {
        dst.set(src.subarray(srcOffset, srcOffset + width), dstOffset);
        dstOffset += width;
        srcOffset += stride;
      }
    }
    return dst;
  }

  /**
   * Releases this decoder.
   * The decoder can't be used anmore.
   */
  release() {
    this.lib.heif_context_free(this.ctx);
    // Avoid invoking wasm later.
    (this.lib as any) = undefined;
    (this.ctx as any) = undefined;
  }

  private checkReleased() {
    if (!this.lib || !this.ctx) {
      throw new Error("This decoder is released.");
    }
  }

  private checkHeifError<Type>(x: Type | heif_error): Type {
    if (this.isHeifError(x)) {
      throw new Error(this.lib.heif_error_code[x.code]);
    }
    return x;
  }

  private isHeifError(x: any): x is heif_error {
    return "code" in x && "subcode" in x;
  }
}
