"use client";

import { useEffect, useRef } from "react";

const REVEAL_DURATION = 850;

const FINISH_DURATION = 1000;

export function asciiFinish(progress: number) {
  const ease = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  return {
    color: ease(progress / 0.55),
    background: 1 - ease((progress - 0.16) / 0.74),
    glyphs: 1 - ease((progress - 0.42) / 0.58),
  };
}

export function asciiGlyph(density: number) {
  const glyphs = ".:+x0369#";
  return glyphs[
    Math.min(
      glyphs.length - 1,
      Math.max(0, Math.floor(density * glyphs.length)),
    )
  ];
}

export function asciiDetail(pixels: Uint8ClampedArray, columns: number) {
  const light = Array.from({ length: pixels.length / 4 }, (_, index) => {
    const offset = index * 4;
    const alpha = pixels[offset + 3] / 255;
    return (
      ((pixels[offset] * 0.2126 +
        pixels[offset + 1] * 0.7152 +
        pixels[offset + 2] * 0.0722) /
        255) *
        alpha +
      1 -
      alpha
    );
  });
  const sorted = [...light].sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.03)] ?? 0;
  const high = sorted[Math.floor(sorted.length * 0.97)] ?? 1;
  const range = Math.max(0.25, high - low);
  const darkBackground = (sorted[Math.floor(sorted.length / 2)] ?? 1) < 0.45;
  return light.map((value, index) => {
    const x = index % columns;
    const left = light[x > 0 ? index - 1 : index];
    const right =
      light[x < columns - 1 ? Math.min(light.length - 1, index + 1) : index];
    const above = light[index >= columns ? index - columns : index];
    const below =
      light[index + columns < light.length ? index + columns : index];
    const edge = Math.min(
      1,
      (Math.hypot(right - left, below - above) * 1.2) / range,
    );
    const normalized = high - low < 0.25 ? value : (value - low) / range;
    const tone = Math.pow(
      Math.max(0, Math.min(1, darkBackground ? normalized : 1 - normalized)),
      1.5,
    );
    return { tone, edge };
  });
}

type AsciiRevealProps = {
  src: string;
  ready: boolean;
  active?: boolean;
  onComplete: () => void;
  onRevealStart?: () => void;
  onColorStart?: () => void;
};

export function AsciiReveal({
  src,
  ready,
  active = true,
  onComplete,
  onRevealStart,
  onColorStart,
}: AsciiRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useRef({
    ready,
    active,
    onComplete,
    onRevealStart,
    onColorStart,
  });
  const resume = useRef<(() => void) | null>(null);

  useEffect(() => {
    controls.current = {
      ready,
      active,
      onComplete,
      onRevealStart,
      onColorStart,
    };
    resume.current?.();
  }, [ready, active, onComplete, onRevealStart, onColorStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!src) {
      let completed = false;
      const finish = () => {
        if (controls.current.ready && !completed) {
          completed = true;
          canvas.style.opacity = "0";
          controls.current.onComplete();
        }
      };
      resume.current = finish;
      finish();
      return () => {
        resume.current = null;
      };
    }

    const context = canvas.getContext("2d");
    const sample = document.createElement("canvas");
    const sampler = sample.getContext("2d", { willReadFrequently: true });
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealDuration = REVEAL_DURATION + 50 + Math.random() * 150;
    const image = new window.Image();
    let pixels: Uint8ClampedArray | null = null;
    let details: ReturnType<typeof asciiDetail> = [];
    let lastDraw = -1;
    let inkColor = "";
    let inkRgb = new Uint8ClampedArray([255, 255, 255, 255]);
    let width = 0;
    let height = 0;
    let rows = 0;
    let elapsed = 0;
    let fadeElapsed = 0;
    let previous: number | null = null;
    let frame = 0;
    let visible = false;
    let disposed = false;
    let completed = false;
    let revealStarted = false;
    let colorStarted = false;
    let failed = !context || !sampler;
    let columns = 60;
    canvas.style.opacity = "1";
    canvas.style.background = "var(--color-bg)";

    const complete = () => {
      if (disposed || completed) return;
      completed = true;
      cancelAnimationFrame(frame);
      frame = 0;
      canvas.style.opacity = "0";
      controls.current.onComplete();
    };

    const draw = () => {
      if (!context || !pixels) return;
      context.clearRect(0, 0, width, height);
      const finish = asciiFinish(fadeElapsed / FINISH_DURATION);
      if (finish.color > 0 && !colorStarted) {
        colorStarted = true;
        controls.current.onColorStart?.();
      }
      if (finish.background < 1 && !revealStarted) {
        revealStarted = true;
        controls.current.onRevealStart?.();
      }
      const ink = getComputedStyle(canvas).color;
      if (ink !== inkColor && sampler) {
        sampler.clearRect(0, 0, 1, 1);
        sampler.fillStyle = ink;
        sampler.fillRect(0, 0, 1, 1);
        inkRgb = new Uint8ClampedArray(sampler.getImageData(0, 0, 1, 1).data);
        inkColor = ink;
      }
      context.globalAlpha = finish.background;
      context.fillStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--color-bg")
          .trim() || "#0f0f0f";
      context.fillRect(0, 0, width, height);
      canvas.style.background = "transparent";
      context.font = `${(height / rows) * 0.95}px monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      const progress = Math.min(elapsed / revealDuration, 1);
      const phase = Math.floor(elapsed / 90);
      for (let index = 0; index < details.length; index++) {
        const { tone, edge } = details[index];
        const seed = Math.imul(index + 1, 2654435761) >>> 0;
        const scatter = (seed % 1000) / 1000;
        const prominence = Math.max(tone * 0.7, edge);
        const threshold = scatter * (1 - prominence * 0.45);
        const coverage = 0.025 + Math.pow(progress, 1.35) * 0.975;
        if (threshold > coverage) continue;
        const age = Math.min(1, Math.max(0, (coverage - threshold) * 5));
        const density = Math.min(1, tone * 0.9 + edge * 0.15);
        const changing = progress < 0.85 && age < 0.85;
        const variants =
          density > 0.65 ? "0369#X" : density > 0.25 ? ":=+x" : ".:";
        const glyph = changing
          ? variants[((seed >>> 8) + phase) % variants.length]
          : density < 0.12
            ? "."
            : asciiGlyph(density);
        const x = ((index % columns) + 0.5) * (width / columns);
        const y = (Math.floor(index / columns) + 0.5) * (height / rows);
        const opacity = (0.07 + prominence * 0.9) * age * age * (3 - 2 * age);
        const offset = index * 4;
        const red = inkRgb[0] + (pixels[offset] - inkRgb[0]) * finish.color;
        const green =
          inkRgb[1] + (pixels[offset + 1] - inkRgb[1]) * finish.color;
        const blue =
          inkRgb[2] + (pixels[offset + 2] - inkRgb[2]) * finish.color;
        context.fillStyle = `rgb(${red} ${green} ${blue})`;
        context.globalAlpha =
          (opacity + (0.95 - opacity) * finish.color) * finish.glyphs;
        context.fillText(glyph, x, y);
      }
      context.globalAlpha = 1;
    };

    const tick = (now: number) => {
      frame = 0;
      if (disposed || completed) return;
      if (controls.current.ready && (failed || motion.matches)) {
        complete();
        return;
      }
      if (motion.matches) {
        elapsed = revealDuration;
        draw();
        return;
      }
      if (!visible || !controls.current.active || document.hidden || !pixels) {
        previous = null;
        return;
      }
      const delta = previous === null ? 0 : now - previous;
      previous = now;
      const previousElapsed = elapsed;
      elapsed = Math.min(revealDuration, elapsed + delta);
      if (controls.current.ready && elapsed >= revealDuration * 0.8) {
        const finishDelta = Math.min(
          delta,
          Math.max(0, elapsed - revealDuration * 0.8),
        );
        fadeElapsed = Math.min(FINISH_DURATION, fadeElapsed + finishDelta);
      }
      if (
        fadeElapsed > 0 ||
        elapsed - lastDraw >= 32 ||
        (previousElapsed < revealDuration && elapsed === revealDuration)
      ) {
        draw();
        lastDraw = elapsed;
      }
      if (fadeElapsed === FINISH_DURATION) {
        complete();
        return;
      }
      if (elapsed < revealDuration || controls.current.ready) {
        frame = requestAnimationFrame(tick);
      } else {
        previous = null;
      }
    };

    const wake = () => {
      if (disposed || completed) return;
      cancelAnimationFrame(frame);
      previous = null;
      frame = requestAnimationFrame(tick);
    };
    resume.current = wake;

    const resize = () => {
      if (disposed || failed) return;
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!image.naturalWidth || !image.naturalHeight) return;
      columns = Math.max(32, Math.min(100, Math.round(width / 6)));
      rows = Math.max(
        1,
        Math.min(180, Math.round((height / width) * columns * 0.6)),
      );
      sample.width = columns;
      sample.height = rows;
      const scale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight,
      );
      const cropWidth = width / scale;
      const cropHeight = height / scale;
      try {
        sampler!.drawImage(
          image,
          (image.naturalWidth - cropWidth) / 2,
          (image.naturalHeight - cropHeight) / 2,
          cropWidth,
          cropHeight,
          0,
          0,
          columns,
          rows,
        );
        pixels = sampler!.getImageData(0, 0, columns, rows).data;
        details = asciiDetail(pixels, columns);
        draw();
      } catch {
        failed = true;
      }
      wake();
    };

    const timeout = window.setTimeout(() => {
      if (!pixels) {
        failed = true;
        wake();
      }
    }, 5000);
    image.onload = () => {
      window.clearTimeout(timeout);
      resize();
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      failed = true;
      wake();
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    const observer = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(draw);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class", "data-theme"],
    });
    intersection.observe(canvas);
    observer.observe(canvas);
    motion.addEventListener("change", wake);
    document.addEventListener("visibilitychange", wake);
    image.src = src;
    resize();
    wake();

    return () => {
      disposed = true;
      resume.current = null;
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      intersection.disconnect();
      observer.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener("change", wake);
      document.removeEventListener("visibilitychange", wake);
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        zIndex: 2,
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    />
  );
}
