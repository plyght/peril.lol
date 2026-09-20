export type RGB = readonly [number, number, number];

export function ditherTile(color: RGB): Uint8ClampedArray<ArrayBuffer> {
  const data = new Uint8ClampedArray(8 * 8 * 4);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let rank = 0;
      for (let bit = 0; bit < 3; bit++) {
        const xx = (x >> bit) & 1;
        const yy = (y >> bit) & 1;
        rank = rank * 4 + ((xx ^ yy) * 2 + yy);
      }
      const threshold = (rank + 0.5) / 64;
      const offset = (y * 8 + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const value = Math.max(0, Math.min(255, color[channel]));
        const lower = Math.floor(value);
        data[offset + channel] = lower + (value - lower > threshold ? 1 : 0);
      }
      data[offset + 3] = 255;
    }
  }
  return data;
}
