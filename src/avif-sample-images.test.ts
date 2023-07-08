import { describe, expect, it } from "@jest/globals";
import init, {
  libheif,
  heif_item_id,
  heif_image_handle,
  heif_image,
  heif_context,
} from "./libheif";
import fs from "fs";

describe("avif-sample-images.test", () => {
  function decodeImage(
    libheif: libheif,
    ctx: heif_context,
    id: heif_item_id
  ): heif_image {
    const handle = libheif.heif_js_context_get_image_handle(
      ctx,
      id
    ) as heif_image_handle;
    const image = libheif.heif_js_decode_image(
      handle,
      libheif.heif_colorspace.heif_colorspace_YCbCr,
      libheif.heif_chroma.heif_chroma_420
    ) as heif_image;
    libheif.heif_image_handle_release(handle);
    return image;
  }

  async function decodeAvif(buffer: Buffer): Promise<heif_image> {
    const libheif = await init();
    const ctx = libheif.heif_context_alloc();

    const error = libheif.heif_context_read_from_memory(ctx, buffer);
    expect(error.code).toBe(libheif.heif_error_code.heif_error_Ok);
    expect(error.subcode).toBe(
      libheif.heif_suberror_code.heif_suberror_Unspecified
    );

    expect(libheif.heif_context_get_number_of_top_level_images(ctx)).toBe(1);

    const itemIds = libheif.heif_js_context_get_list_of_top_level_image_IDs(
      ctx
    ) as heif_item_id[];
    expect(itemIds.length).toBe(1);

    const image = decodeImage(libheif, ctx, itemIds[0]);

    libheif.heif_context_free(ctx);

    return image;
  }

  async function decode(file: string): Promise<heif_image> {
    const buffer = fs.readFileSync(`third_party/avif-sample-images/${file}`);
    return decodeAvif(buffer);
  }

  fs.readdirSync("third_party/avif-sample-images").forEach((file) => {
    if (file.startsWith("fox") && file.endsWith("avif")) {
      it(file, async () => {
        const image = await decode(file);
        expect(image.width).toBe(file.includes("odd-width") ? 1203 : 1204);
        expect(image.height).toBe(file.includes("odd-height") ? 799 : 800);
      });
    }
  });
});
