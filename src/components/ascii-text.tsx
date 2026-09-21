"use client";

import { useEffect, useRef } from "react";

export function textRevealFrame(progress: number) {
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  return {
    coverage: smooth(progress / 0.45),
    resolved: smooth((progress - 0.6) / 0.4),
  };
}

export function AsciiText({
  text,
  duration = 500,
  active = true,
  className,
}: {
  text: string;
  duration?: number;
  active?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const originalRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const original = originalRef.current;
    const canvas = canvasRef.current;
    if (!container || !original || !canvas) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let disposed = false;
    const finish = () => {
      cancelAnimationFrame(frame);
      original.style.opacity = "1";
      canvas.style.visibility = "hidden";
    };
    if (
      !active ||
      motion.matches ||
      !text ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      finish();
      return;
    }
    original.style.opacity = "0";
    const onMotion = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener("change", onMotion);
    const start = async () => {
      await document.fonts.ready;
      if (disposed || motion.matches) return;
      const context = canvas.getContext("2d");
      const mask = document.createElement("canvas");
      const painter = mask.getContext("2d");
      const sample = document.createElement("canvas");
      const sampler = sample.getContext("2d", { willReadFrequently: true });
      if (!context || !painter || !sampler) {
        finish();
        return;
      }
      const layout = getComputedStyle(container);
      const width = parseFloat(layout.width);
      const height = parseFloat(layout.height);
      if (!width || !height) {
        finish();
        return;
      }
      const style = getComputedStyle(original);
      const fontSize = parseFloat(style.fontSize);
      const cell = fontSize > 60 ? 5 : 2;
      const columns = Math.max(1, Math.round(width / cell));
      const rows = Math.max(1, Math.round(height / (cell * 1.7)));
      mask.width = Math.ceil(width);
      mask.height = Math.ceil(height);
      painter.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      painter.letterSpacing =
        style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
      const metrics = painter.measureText(text);
      const ascent = metrics.fontBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent;
      painter.fillStyle = style.color;
      painter.fillText(text, 0, (height - ascent - descent) / 2 + ascent);
      sample.width = columns;
      sample.height = rows;
      sampler.drawImage(mask, 0, 0, columns, rows);
      const pixels = sampler.getImageData(0, 0, columns, rows).data;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.font = `${height / rows}px monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      const started = performance.now();
      canvas.style.visibility = "visible";
      const tick = (now: number) => {
        if (disposed || motion.matches) {
          finish();
          return;
        }
        const progress = Math.min(1, (now - started) / duration);
        const state = textRevealFrame(progress);
        original.style.opacity = "0";
        context.clearRect(0, 0, width, height);
        context.fillStyle = getComputedStyle(original).color;
        for (let index = 0; index < columns * rows; index++) {
          const alpha = pixels[index * 4 + 3] / 255;
          if (alpha < 0.08) continue;
          const seed = Math.imul(index + 1, 2654435761) >>> 0;
          const threshold = (seed % 1000) / 1000;
          const x = ((index % columns) * width) / columns;
          const y = (Math.floor(index / columns) * height) / rows;
          const cellWidth = width / columns;
          const cellHeight = height / rows;
          if (threshold < state.resolved) {
            context.drawImage(
              mask,
              x,
              y,
              cellWidth,
              cellHeight,
              x,
              y,
              cellWidth,
              cellHeight,
            );
          } else if (threshold < state.coverage) {
            context.fillText(
              ".:+x0369#"[Math.min(8, Math.floor(alpha * 9))],
              x + cellWidth / 2,
              y + cellHeight / 2,
            );
          }
        }
        context.globalAlpha = 1;
        if (progress < 1) frame = requestAnimationFrame(tick);
        else finish();
      };
      frame = requestAnimationFrame(tick);
    };
    void start().catch(finish);
    const layout = getComputedStyle(container);
    let observedWidth = parseFloat(layout.width);
    let observedHeight = parseFloat(layout.height);
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (
        Math.abs(width - observedWidth) > 0.5 ||
        Math.abs(height - observedHeight) > 0.5
      )
        finish();
      observedWidth = width;
      observedHeight = height;
    });
    observer.observe(container);
    return () => {
      disposed = true;
      finish();
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
    };
  }, [text, duration, active]);

  return (
    <span
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
      }}
    >
      <span ref={originalRef} className={className}>
        {text}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />
    </span>
  );
}
