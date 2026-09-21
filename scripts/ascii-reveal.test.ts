import { describe, expect, test } from "bun:test";
import {
  asciiDetail,
  asciiFinish,
  asciiGlyph,
} from "../src/components/ascii-reveal";

describe("asciiGlyph", () => {
  test("maps dark pixels to denser glyphs", () => {
    expect(
      Array.from({ length: 9 }, (_, index) => asciiGlyph(index / 9)).join(""),
    ).toBe(".:+x0369#");
  });

  test("clamps density and stays deterministic", () => {
    expect(asciiGlyph(-1)).toBe(".");
    expect(asciiGlyph(2)).toBe("#");
    expect(asciiGlyph(0.6)).toBe(asciiGlyph(0.6));
  });
});

describe("asciiDetail", () => {
  test("preserves silhouettes and emphasizes boundaries", () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
      255, 255, 255,
    ]);
    const detail = asciiDetail(pixels, 5);
    expect(detail[0].tone).toBe(1);
    expect(detail[2].tone).toBe(0);
    expect(detail[1].edge).toBeGreaterThan(detail[0].edge);
  });

  test("uses bright features against dark backgrounds", () => {
    const detail = asciiDetail(
      new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255]),
      3,
    );
    expect(detail[0].tone).toBe(0);
    expect(detail[2].tone).toBe(1);
  });

  test("keeps flat and transparent images finite", () => {
    const detail = asciiDetail(new Uint8ClampedArray(16), 2);
    expect(detail.every(({ tone, edge }) => tone === 0 && edge === 0)).toBe(
      true,
    );
    expect(asciiDetail(new Uint8ClampedArray(), 1)).toEqual([]);
  });
});

describe("asciiFinish", () => {
  test("overlaps color and image while keeping glyphs visible", () => {
    expect(asciiFinish(0)).toEqual({ color: 0, background: 1, glyphs: 1 });
    const mixed = asciiFinish(0.35);
    expect(mixed.color).toBeGreaterThan(0);
    expect(mixed.color).toBeLessThan(1);
    expect(mixed.background).toBeLessThan(1);
    expect(mixed.glyphs).toBe(1);
    expect(asciiFinish(0.7).glyphs).toBeGreaterThan(0);
    expect(asciiFinish(0.7).glyphs).toBeLessThan(1);
    expect(asciiFinish(1)).toEqual({ color: 1, background: 0, glyphs: 0 });
    expect(asciiFinish(2)).toEqual(asciiFinish(1));
    expect(asciiFinish(-1)).toEqual(asciiFinish(0));
  });
});
