import {describe, expect, it} from '@jest/globals';
import init from './libheif';

describe("libheif", () => {
    it("heif_get_version", async () => {
        const libheif = await init()
        expect(libheif.heif_get_version()).toBe("1.16.2")
    })

    it("heif_get_version_number", async () => {
        const libheif = await init()
        expect(libheif.heif_get_version_number()).toBe(17826304)
    })

    it("heif_context_alloc/free", async () => {
        const libheif = await init()
        const ctx = libheif.heif_context_alloc()
        expect(ctx).not.toBe(0)
        libheif.heif_context_free(ctx)
    })
})
