import { describe, expect, test } from "bun:test";
import { displayDimensions } from "./photo-dimensions";

describe("displayDimensions", () => {
  test("uses the stored dimensions for an unrotated image", () => {
    expect(displayDimensions({ width: 3968, height: 2232 })).toEqual({
      w: 3968,
      h: 2232,
    });
  });

  test("uses the display dimensions for an EXIF-rotated image", () => {
    expect(
      displayDimensions({
        width: 3968,
        height: 2232,
        autoOrient: { width: 2232, height: 3968 },
      }),
    ).toEqual({ w: 2232, h: 3968 });
  });
});
