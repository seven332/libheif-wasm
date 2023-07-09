var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import init from "./libheif.js";
export class HeifDecoder {
    /**
     * Creates a heif decoder from buffer.
     * Remember invoking `release` if you don't need
     * the buffer anymore, or memory leak in wasm.
     *
     * @param buffer a buffer contains a heif file
     * @returns the buffer to decode the heif file
     * @throws if it's not a heif file
     */
    static from(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!HeifDecoder.promise) {
                HeifDecoder.promise = init();
            }
            const libheif = yield HeifDecoder.promise;
            const ctx = libheif.heif_context_alloc();
            const error = libheif.heif_context_read_from_memory(ctx, buffer);
            if (error.code != libheif.heif_error_code.heif_error_Ok) {
                throw new Error(libheif.heif_error_code[error.code]);
            }
            return new HeifDecoder(libheif, ctx);
        });
    }
    constructor(libheif, ctx) {
        this.libheif = libheif;
        this.ctx = ctx;
    }
    /**
     * Returns the number of images.
     *
     * @returns the number of images
     * @throws if this decoder is released
     */
    getNumberOfImages() {
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
    decodeImage(index) {
        this.checkReleased();
        const items = this.checkHeifError(this.libheif.heif_js_context_get_list_of_top_level_image_IDs(this.ctx));
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
    decodeAllImages() {
        this.checkReleased();
        return this.checkHeifError(this.libheif.heif_js_context_get_list_of_top_level_image_IDs(this.ctx)).map((id) => this.decode(id));
    }
    decode(id) {
        const handle = this.checkHeifError(this.libheif.heif_js_context_get_image_handle(this.ctx, id));
        const image = this.checkHeifError(this.libheif.heif_js_decode_image_rgba(handle));
        const heifImage = {
            width: image.width,
            height: image.height,
            data: this.stridedCopy(image.plane, image.width * 4, image.height, image.stride),
        };
        this.libheif.heif_image_release(image.ptr);
        this.libheif.heif_image_handle_release(handle);
        return heifImage;
    }
    stridedCopy(src, width, height, stride) {
        const dst = new Uint8Array(width * height);
        if (width == stride) {
            dst.set(src);
        }
        else {
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
        this.libheif.heif_context_free(this.ctx);
        // Avoid invoking wasm later.
        this.libheif = undefined;
        this.ctx = undefined;
    }
    checkReleased() {
        if (!this.libheif || !this.ctx) {
            throw new Error("This decoder is released.");
        }
    }
    checkHeifError(x) {
        if (this.isHeifError(x)) {
            throw new Error(this.libheif.heif_error_code[x.code]);
        }
        return x;
    }
    isHeifError(x) {
        return "code" in x && "subcode" in x;
    }
}
