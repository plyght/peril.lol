import { expect, test } from "bun:test";
import {
  areUnicornAssetsReady,
  sampleUnicornCells,
} from "../src/lib/unicorn-reveal";

test("samples alpha only, preserving opaque white, black, and partial coverage", () => {
  const cells = sampleUnicornCells(
    new Uint8ClampedArray([
      255, 255, 255, 0, 255, 255, 255, 255, 0, 0, 0, 255, 25, 50, 75, 128,
    ]),
    2,
  );
  expect(cells).toHaveLength(3);
  expect(
    cells.map(({ x, y, color, alpha }) => ({ x, y, color, alpha })),
  ).toEqual([
    { x: 1, y: 0, color: "rgb(255 255 255)", alpha: 1 },
    { x: 0, y: 1, color: "rgb(0 0 0)", alpha: 1 },
    { x: 1, y: 1, color: "rgb(25 50 75)", alpha: 128 / 255 },
  ]);
  expect(cells.every(({ delay }) => delay >= 50 && delay < 200)).toBe(true);
  expect(sampleUnicornCells(new Uint8ClampedArray(16), 2)).toEqual([]);
});

test("waits for initialized scenes and every visible asset without sampling", () => {
  const scene = {
    initialized: false,
    local: { preloadedImages: { portrait: { loading: true } } },
    layers: [{ layerType: "image", local: { imageReady: false } }],
  };
  expect(areUnicornAssetsReady(scene)).toBe(false);
  scene.initialized = true;
  expect(areUnicornAssetsReady(scene)).toBe(false);
  scene.local.preloadedImages.portrait.loading = false;
  expect(areUnicornAssetsReady(scene)).toBe(false);
  scene.layers[0].local.imageReady = true;
  expect(areUnicornAssetsReady(scene)).toBe(true);
  expect(areUnicornAssetsReady({ initialized: true })).toBe(false);
  expect(
    areUnicornAssetsReady({
      initialized: true,
      layers: [{ visible: false, isModel: true }],
    }),
  ).toBe(true);
  expect(
    areUnicornAssetsReady({
      initialized: true,
      layers: [{ layerType: "text", local: { loaded: false } }],
    }),
  ).toBe(false);
  expect(
    areUnicornAssetsReady({
      initialized: true,
      layers: [{ isModel: true, local: { modelLoaded: false } }],
    }),
  ).toBe(false);
  const flattened = {
    isFlattened: true,
    areTextAssetsReady: () => true,
    areImageAssetsReady: () => false,
    areModelAssetsReady: () => true,
  };
  expect(
    areUnicornAssetsReady({ initialized: true, layers: [flattened] }),
  ).toBe(false);
  flattened.areImageAssetsReady = () => true;
  expect(
    areUnicornAssetsReady({ initialized: true, layers: [flattened] }),
  ).toBe(true);
  expect(
    areUnicornAssetsReady({
      initialized: true,
      layers: [{ isFlattened: true }],
    }),
  ).toBe(false);
});
