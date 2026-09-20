import { ditherTile, type RGB } from "@/lib/color-dither";

let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;
let tile: HTMLCanvasElement | null = null;
let tileContext: CanvasRenderingContext2D | null = null;
let current: RGB = [15, 15, 15];
let frame = 0;

function readColor(css: string): RGB {
  tileContext!.fillStyle = css;
  tileContext!.fillRect(0, 0, 1, 1);
  const data = tileContext!.getImageData(0, 0, 1, 1).data;
  return [data[0], data[1], data[2]];
}

function paint() {
  if (!canvas || !context || !tile || !tileContext) return;
  tileContext.putImageData(new ImageData(ditherTile(current), 8, 8), 0, 0);
  const pattern = context.createPattern(tile, "repeat");
  if (!pattern) return;
  context.fillStyle = pattern;
  context.fillRect(0, 0, canvas.width, canvas.height);
  canvas.dataset.color = current.map((value) => value.toFixed(4)).join(",");
}

function resize() {
  if (!canvas) return;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.ceil(window.innerWidth * scale);
  canvas.height = Math.ceil(window.innerHeight * scale);
  paint();
}

function dispose() {
  cancelAnimationFrame(frame);
  frame = 0;
  window.removeEventListener("resize", resize);
  canvas?.remove();
  canvas = null;
  context = null;
  tile = null;
  tileContext = null;
  document.documentElement.classList.remove("cover-dithered");
}

export function fadeCoverBackground(color: string | null) {
  if (!canvas) {
    if (!color) return;
    const nextCanvas = document.createElement("canvas");
    const nextTile = document.createElement("canvas");
    nextTile.width = nextTile.height = 8;
    const nextContext = nextCanvas.getContext("2d", { alpha: false });
    const nextTileContext = nextTile.getContext("2d", {
      willReadFrequently: true,
    });
    if (!nextContext || !nextTileContext) return;
    canvas = nextCanvas;
    context = nextContext;
    tile = nextTile;
    tileContext = nextTileContext;
    current = readColor(getComputedStyle(document.body).backgroundColor);
    canvas.className = "cover-background";
    canvas.setAttribute("aria-hidden", "true");
    resize();
    document.body.appendChild(canvas);
    document.documentElement.classList.add("cover-dithered");
    window.addEventListener("resize", resize);
  }

  cancelAnimationFrame(frame);
  const from = current;
  const target = readColor(
    color ?? getComputedStyle(document.body).backgroundColor,
  );
  const start = performance.now();
  const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 550;
  const tick = (now: number) => {
    const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
    const eased = progress * progress * (3 - 2 * progress);
    current = [
      from[0] + (target[0] - from[0]) * eased,
      from[1] + (target[1] - from[1]) * eased,
      from[2] + (target[2] - from[2]) * eased,
    ];
    paint();
    if (progress < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = 0;
      if (!color) dispose();
    }
  };
  tick(start);
}
