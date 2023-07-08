import { describe, expect, it } from "@jest/globals";
import init, { heif_item_id, heif_image_handle, heif_image } from "./libheif";
import fs from "fs";

describe("libheif", () => {
  function getHeicBuffer() {
    return fs.readFileSync("third_party/libheif/examples/example.heic");
  }

  it("heif_get_version", async () => {
    const libheif = await init();
    expect(libheif.heif_get_version()).toBe("1.16.2");
  });

  it("heif_get_version_number", async () => {
    const libheif = await init();
    expect(libheif.heif_get_version_number()).toBe(17826304);
  });

  it("heif_context_alloc/free", async () => {
    const libheif = await init();
    const ctx = libheif.heif_context_alloc();
    libheif.heif_context_free(ctx);
  });

  it("heif_context_read_from_memory fail", async () => {
    const libheif = await init();
    const ctx = libheif.heif_context_alloc();
    const error = libheif.heif_context_read_from_memory(ctx, "");
    expect(error.code).toBe(libheif.heif_error_code.heif_error_Invalid_input);
    expect(error.subcode).toBe(
      libheif.heif_suberror_code.heif_suberror_No_ftyp_box
    );
    libheif.heif_context_free(ctx);
  });

  it("decode heic", async () => {
    const libheif = await init();
    const ctx = libheif.heif_context_alloc();

    const error = libheif.heif_context_read_from_memory(ctx, getHeicBuffer());
    expect(error.code).toBe(libheif.heif_error_code.heif_error_Ok);
    expect(error.subcode).toBe(
      libheif.heif_suberror_code.heif_suberror_Unspecified
    );

    expect(libheif.heif_context_get_number_of_top_level_images(ctx)).toBe(2);

    const itemIds = libheif.heif_js_context_get_list_of_top_level_image_IDs(
      ctx
    ) as heif_item_id[];
    expect(itemIds.length).toBe(2);

    // image 0
    {
      const handle = libheif.heif_js_context_get_image_handle(
        ctx,
        itemIds[0]
      ) as heif_image_handle;

      const image = libheif.heif_js_decode_image(
        handle,
        libheif.heif_colorspace.heif_colorspace_YCbCr,
        libheif.heif_chroma.heif_chroma_420
      ) as heif_image;

      expect(image.is_primary).toBe(1);
      expect(image.thumbnails).toBe(1);
      expect(image.width).toBe(1280);
      expect(image.height).toBe(854);
      expect(image.chroma).toBe(libheif.heif_chroma.heif_chroma_420);
      expect(image.colorspace).toBe(
        libheif.heif_colorspace.heif_colorspace_YCbCr
      );
      expect(image.data.length).toEqual(1639680);

      libheif.heif_image_handle_release(handle);
    }

    // image 1
    {
      const handle = libheif.heif_js_context_get_image_handle(
        ctx,
        itemIds[1]
      ) as heif_image_handle;

      const image = libheif.heif_js_decode_image(
        handle,
        libheif.heif_colorspace.heif_colorspace_YCbCr,
        libheif.heif_chroma.heif_chroma_420
      ) as heif_image;

      expect(image.is_primary).toBe(0);
      expect(image.thumbnails).toBe(1);
      expect(image.width).toBe(1280);
      expect(image.height).toBe(854);
      expect(image.chroma).toBe(libheif.heif_chroma.heif_chroma_420);
      expect(image.colorspace).toBe(
        libheif.heif_colorspace.heif_colorspace_YCbCr
      );
      expect(image.data.length).toEqual(1639680);

      libheif.heif_image_handle_release(handle);
    }

    libheif.heif_context_free(ctx);
  });
});
