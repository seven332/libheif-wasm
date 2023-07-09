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
        const image = this.checkHeifError(this.libheif.heif_js_decode_image(handle, this.libheif.heif_colorspace.heif_colorspace_YCbCr, this.libheif.heif_chroma.heif_chroma_420));
        this.libheif.heif_image_handle_release(handle);
        return this.convert(image);
    }
    convert(image) {
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
        const v = image.data.subarray(stridey * h + strideu * h2, stridey * h + strideu * h2 + stridev * h2);
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
