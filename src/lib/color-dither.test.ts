import { describe, expect, test } from "bun:test";
import { ditherTile } from "./color-dither";

function mean(data: Uint8ClampedArray, channel: number) {
  let sum = 0;
  for (let offset = channel; offset < data.length; offset += 4)
    sum += data[offset];
  return sum / 64;
}

describe("background color precision", () => {
  test("solid endpoints have no texture", () => {
    for (const color of [0, 13, 15, 17, 244, 255]) {
      const tile = ditherTile([color, color, color]);
      for (let offset = 0; offset < tile.length; offset += 4) {
        expect([...tile.slice(offset, offset + 4)]).toEqual([
          color,
          color,
          color,
          255,
        ]);
      }
    }
  });

  test("fractional shades preserve their average within half a tile level", () => {
    for (let step = 0; step <= 100; step++) {
      const color = [
        15 - (2 * step) / 100,
        15 + step / 100,
        15 + (2 * step) / 100,
      ] as const;
      const tile = ditherTile(color);
      for (let channel = 0; channel < 3; channel++) {
        expect(
          Math.abs(mean(tile, channel) - color[channel]),
        ).toBeLessThanOrEqual(1 / 128 + 1e-10);
      }
    }
  });

  test("a one-level fade has 65 evenly ordered shades instead of two", () => {
    const shades = Array.from({ length: 65 }, (_, step) =>
      mean(ditherTile([15 + step / 64, 15, 15]), 0),
    );
    expect(new Set(shades).size).toBe(65);
    for (let step = 0; step < shades.length; step++)
      expect(shades[step]).toBe(15 + step / 64);
  });
});
