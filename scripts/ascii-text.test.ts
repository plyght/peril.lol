import { expect, test } from "bun:test";
import { textRevealFrame } from "../src/components/ascii-text";

test("ASCII fills the text mask before cells resolve to solid text", () => {
  expect(textRevealFrame(0)).toEqual({ coverage: 0, resolved: 0 });
  expect(textRevealFrame(0.3).coverage).toBeGreaterThan(0);
  expect(textRevealFrame(0.3).resolved).toBe(0);
  expect(textRevealFrame(0.5).coverage).toBe(1);
  expect(textRevealFrame(0.6).resolved).toBe(0);
  expect(textRevealFrame(0.75).resolved).toBeGreaterThan(0);
  expect(textRevealFrame(1)).toEqual({ coverage: 1, resolved: 1 });
  expect(textRevealFrame(2)).toEqual(textRevealFrame(1));
});
