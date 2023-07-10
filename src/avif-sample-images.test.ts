import { describe, expect, it } from "@jest/globals";
import fs from "fs";
import { HeifDecoder, HeifImage, HeifWasm } from "./index";

describe("avif-sample-images.test", () => {
  async function decode(file: string): Promise<HeifImage> {
    const buffer = fs.readFileSync(`third_party/avif-sample-images/${file}`);
    const wasm = await HeifWasm.load();
    const decoder = wasm.decoder(buffer);
    expect(decoder.getNumberOfImages()).toBe(1);
    return decoder.decodeImage(0);
  }

  fs.readdirSync("third_party/avif-sample-images").forEach((file) => {
    if (file.startsWith("fox") && file.endsWith("avif")) {
      it(file, async () => {
        const image = await decode(file);
        expect(image.width).toBe(file.includes("odd-width") ? 1203 : 1204);
        expect(image.height).toBe(file.includes("odd-height") ? 799 : 800);
      });
    } else if (file.startsWith("hato") && file.endsWith("avif")) {
      it(file, async () => {
        const image = await decode(file);
        expect(image.width).toBe(
          file.includes("10bpc") || file.includes("12bpc") ? 3078 : 3082
        );
        expect(image.height).toBe(2048);
      });
    } else if (file.startsWith("plum-blossom-large") && file.endsWith("avif")) {
      it(file, async () => {
        const image = await decode(file);
        expect(image.width).toBe(2048);
        expect(image.height).toBe(2048);
      });
    } else if (file.startsWith("plum-blossom-small") && file.endsWith("avif")) {
      it(file, async () => {
        const image = await decode(file);
        expect(image.width).toBe(128);
        expect(image.height).toBe(128);
      });
    } else if (
      file.startsWith("red-at-12-oclock-with-color") &&
      file.endsWith("avif")
    ) {
      it(file, async () => {
        const image = await decode(file);
        expect(image.width).toBe(800);
        expect(image.height).toBe(800);
      });
    }
  });
});
