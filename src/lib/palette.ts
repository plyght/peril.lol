export interface Swatch {
  h: number;
  s: number;
  l: number;
  weight: number;
}

export interface CoverAnalysis {
  primary: Swatch;
  secondary: Swatch | null;
  energy: number;
  mono: boolean;
}

export interface Palette {
  bg: string;
  surface: string;
  border: string;
  text: string;
  secondary: string;
  dim: string;
  accent: string;
  accentWash: string;
}

const BUCKETS = 36;
const GRAY_S = 0.14;
const HUE_SPLIT = 45;

/*
  Colour per pixel, averaged over the sleeve. A cream white or a scanned paper
  stock clears the saturation floor and covers the whole canvas, so counting
  such pixels would hand the page a yellow it does not really have; weighing
  them instead leaves them worth almost nothing. Below MONO the sleeve is read
  as black and white and the page goes neutral rather than guessing a hue.
*/
const MONO = 0.1;
const FULL = 0.45;

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60;
  else if (max === gg) h = ((bb - rr) / d + 2) * 60;
  else h = ((rr - gg) / d + 4) * 60;
  return [h, s, l];
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function css(h: number, s: number, l: number, alpha = 1): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.round(Math.min(Math.max(s, 0), 1) * 100);
  const ll = Math.round(Math.min(Math.max(l, 0), 1) * 100);
  return alpha === 1 ? `hsl(${hh.toFixed(1)} ${ss}% ${ll}%)` : `hsl(${hh.toFixed(1)} ${ss}% ${ll}% / ${alpha})`;
}

/*
  Colours are bucketed by hue and kept apart rather than averaged — a sleeve
  that is half blue and half red has to come back as blue and red, not as the
  mud between them. Each bucket is weighted by how much of the sleeve it covers
  and how saturated it is, with near-black and near-white pixels discounted
  since they carry almost no hue.
*/
export function analyzePixels(data: Uint8ClampedArray): CoverAnalysis | null {
  const sumS = new Float64Array(BUCKETS);
  const sumL = new Float64Array(BUCKETS);
  const sumSin = new Float64Array(BUCKETS);
  const sumCos = new Float64Array(BUCKETS);
  const weight = new Float64Array(BUCKETS);
  let counted = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    counted += 1;
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    if (s < GRAY_S || l < 0.06 || l > 0.96) continue;

    // A mid-lightness, saturated pixel says the most about the sleeve's colour.
    const w = s * (1 - Math.abs(l - 0.5) * 1.4);
    if (w <= 0) continue;
    const b = Math.min(BUCKETS - 1, Math.floor((h / 360) * BUCKETS));
    const rad = (h * Math.PI) / 180;
    weight[b] += w;
    sumS[b] += s * w;
    sumL[b] += l * w;
    sumSin[b] += Math.sin(rad) * w;
    sumCos[b] += Math.cos(rad) * w;
  }

  if (!counted) return null;

  let mass = 0;
  for (let b = 0; b < BUCKETS; b += 1) mass += weight[b];
  const energy = mass / counted;

  const swatches: Swatch[] = [];
  for (let b = 0; b < BUCKETS; b += 1) {
    if (weight[b] <= 0) continue;
    const h = (Math.atan2(sumSin[b], sumCos[b]) * 180) / Math.PI;
    swatches.push({
      h: (h + 360) % 360,
      s: sumS[b] / weight[b],
      l: sumL[b] / weight[b],
      weight: weight[b],
    });
  }

  const grey: Swatch = { h: 0, s: 0, l: 0.5, weight: 0 };
  if (!swatches.length) {
    return { primary: grey, secondary: null, energy: 0, mono: true };
  }
  swatches.sort((a, b) => b.weight - a.weight);

  const primary = swatches[0];

  if (energy < MONO) {
    return { primary: grey, secondary: null, energy, mono: true };
  }

  /*
    The accent is the sleeve's second voice, not its loudest one: the strongest
    hue far enough from the dominant to read as a different colour, provided it
    holds a real share of the cover. Meantime is mostly red with a blue block —
    the block is what should light up the links.
  */
  const secondary =
    swatches
      .filter(
        (sw) =>
          hueDistance(sw.h, primary.h) >= HUE_SPLIT &&
          sw.weight >= primary.weight * 0.05
      )
      .sort((a, b) => Math.sqrt(b.weight) * b.s - Math.sqrt(a.weight) * a.s)[0] ??
    null;

  return { primary, secondary, energy, mono: false };
}

/*
  The sleeve sets hue; the site keeps its own polarity and its own contrast.
  Backgrounds stay near-black or near-paper with only a wash of the hue, text
  keeps its usual weight, and the accent is pulled to a fixed lightness so it
  reads the same whether the cover is a dark blue or a bright red.
*/
export function paletteFrom(analysis: CoverAnalysis, dark: boolean): Palette {
  const { primary, secondary, energy, mono } = analysis;

  // A sleeve with little colour in it tints; one with none goes neutral outright.
  const strength = mono ? 0 : Math.min(1, energy / FULL);
  const lead = secondary ?? primary;
  const support = primary;

  const bgS = 0.3 * strength;
  const accentS = mono
    ? 0
    : Math.min(0.85, Math.max(0.42, lead.s)) * (0.55 + 0.45 * strength);

  if (dark) {
    return {
      bg: css(primary.h, bgS * 0.9, 0.06),
      surface: css(primary.h, bgS * 0.85, 0.095),
      border: css(primary.h, bgS * 0.8, 0.15),
      text: css(primary.h, 0.09 * strength, 0.92),
      secondary: css(primary.h, 0.12 * strength, 0.58),
      dim: css(primary.h, 0.12 * strength, 0.36),
      accent: css(lead.h, accentS, 0.68),
      accentWash: css(support.h, accentS, 0.68, 0.12),
    };
  }

  return {
    bg: css(primary.h, bgS * 0.55, 0.955),
    surface: css(primary.h, bgS * 0.5, 0.915),
    border: css(primary.h, bgS * 0.45, 0.85),
    text: css(primary.h, 0.12 * strength, 0.11),
    secondary: css(primary.h, 0.14 * strength, 0.42),
    dim: css(primary.h, 0.14 * strength, 0.66),
    accent: css(lead.h, Math.min(0.8, accentS + 0.05), 0.42),
    accentWash: css(support.h, accentS, 0.45, 0.14),
  };
}

const SAMPLE = 64;

export function analyzeImage(img: HTMLImageElement): CoverAnalysis | null {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  try {
    return analyzePixels(ctx.getImageData(0, 0, SAMPLE, SAMPLE).data);
  } catch {
    return null;
  }
}
