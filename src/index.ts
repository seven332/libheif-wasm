import init, {
  heif_context,
  heif_error,
  heif_image,
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
    const libheif = await HeifDecoder.promise;
    const ctx = libheif.heif_context_alloc();
    const error = libheif.heif_context_read_from_memory(ctx, buffer);
    if (error.code != libheif.heif_error_code.heif_error_Ok) {
      throw new Error(libheif.heif_error_code[error.code]);
    }
    return new HeifDecoder(libheif, ctx);
  }

  private constructor(private libheif: libheif, private ctx: heif_context) {}

  /**
   * Returns the number of images.
   *
   * @returns the number of images
   * @throws if this decoder is released
   */
  getNumberOfImages(): number {
    this.checkReleased();
    return this.libheif.heif_context_get_number_of_top_level_images(this.ctx);
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
      this.libheif.heif_js_context_get_list_of_top_level_image_IDs(this.ctx)
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
      this.libheif.heif_js_context_get_list_of_top_level_image_IDs(this.ctx)
    ).map((id) => this.decode(id));
  }

  private decode(id: heif_item_id): HeifImage {
    const handle = this.checkHeifError(
      this.libheif.heif_js_context_get_image_handle(this.ctx, id)
    );
    const image = this.checkHeifError(
      this.libheif.heif_js_decode_image(
        handle,
        this.libheif.heif_colorspace.heif_colorspace_YCbCr,
        this.libheif.heif_chroma.heif_chroma_420
      )
    );
    this.libheif.heif_image_handle_release(handle);
    return this.convert(image);
  }

  private convert(image: heif_image): HeifImage {
    // Algorithm from libheif post.js
    const w = image.width;
    const h = image.height;
    const dest = new Uint8Array(w * h * 4);

    const stridey = w;
    const strideu = Math.ceil(w / 2);
    const stridev = Math.ceil(w / 2);
    const h2 = Math.ceil(h / 2);
    const y = image.data;
    const u = image.data.subarray(stridey * h, stridey * h + strideu * h2);
    const v = image.data.subarray(
      stridey * h + strideu * h2,
      stridey * h + strideu * h2 + stridev * h2
    );

    let xpos = 0;
    let ypos = 0;
    let yoffset = 0;
    let uoffset = 0;
    let voffset = 0;
    let i = 0;
    const maxi = w * h;
    while (i < maxi) {
      const x2 = xpos >> 1;
      let yval = 1.164 * (y[yoffset + xpos] - 16);
      const uval = u[uoffset + x2] - 128;
      const vval = v[voffset + x2] - 128;

      dest[(i << 2) + 0] = yval + 1.596 * vval;
      dest[(i << 2) + 1] = yval - 0.813 * vval - 0.391 * uval;
      dest[(i << 2) + 2] = yval + 2.018 * uval;
      dest[(i << 2) + 3] = 0xff;
      i++;
      xpos++;

      if (xpos < w) {
        yval = 1.164 * (y[yoffset + xpos] - 16);
        dest[(i << 2) + 0] = yval + 1.596 * vval;
        dest[(i << 2) + 1] = yval - 0.813 * vval - 0.391 * uval;
        dest[(i << 2) + 2] = yval + 2.018 * uval;
        dest[(i << 2) + 3] = 0xff;
        i++;
        xpos++;
      }

      if (xpos === w) {
        xpos = 0;
        ypos++;
        yoffset += stridey;
        uoffset = (ypos >> 1) * strideu;
        voffset = (ypos >> 1) * stridev;
      }
    }

    return {
      width: w,
      height: h,
      data: dest,
    };
  }

  /**
   * Releases this decoder.
   * The decoder can't be used anmore.
   */
  release() {
    this.libheif.heif_context_free(this.ctx);
    // Avoid invoking wasm later.
    (this.libheif as any) = undefined;
    (this.ctx as any) = undefined;
  }

  private checkReleased() {
    if (!this.libheif || !this.ctx) {
      throw new Error("This decoder is released.");
    }
  }

  private checkHeifError<Type>(x: Type | heif_error): Type {
    if (this.isHeifError(x)) {
      throw new Error(this.libheif.heif_error_code[x.code]);
    }
    return x;
  }

  private isHeifError(x: any): x is heif_error {
    return "code" in x && "subcode" in x;
  }
}
