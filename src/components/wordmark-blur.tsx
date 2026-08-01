"use client";

import { useEffect, useRef, useState } from "react";

export function WordmarkBlur() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [band, setBand] = useState(0);
  const [chrome, setChrome] = useState(0);

  useEffect(() => {
    const wordmark = document.querySelector<HTMLElement>("[data-blog-wordmark]");
    if (!wordmark) return;

    // `bottom: 0` on a fixed box lands on the layout viewport, which iOS Safari
    // insets above its floating tab bar. `lvh` still measures the whole screen,
    // so the difference is exactly how far we have to reach to sit under it.
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none";
    document.documentElement.appendChild(probe);

    let queued = 0;
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });

    // ratios are relative to the font size, so they survive every resize step
    const FALLBACK = { top: 0.55, bottom: 0.21, baseline: 0.85 };
    // ascender tips and the dots on the i's reach far above the body of the
    // word, and text passing over those strokes stays perfectly readable — the
    // blur is only worth it once the dense part of the glyphs is behind it.
    const COVERAGE = 0.25;
    let cacheKey = "";
    let ratios = FALLBACK;

    const inkRatios = (style: CSSStyleDeclaration) => {
      const size = parseFloat(style.fontSize);
      const key = `${size}|${style.fontWeight}|${style.fontFamily}`;
      if (key === cacheKey) return ratios;
      if (!ctx || !size) return FALLBACK;

      const text = wordmark.textContent ?? "";
      const scale = Math.min(1, 96 / size);
      const px = size * scale;
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${px}px ${style.fontFamily}`;
      const m = ctx.measureText(text);
      if (!m.actualBoundingBoxAscent || !m.fontBoundingBoxAscent) return FALLBACK;

      const w = Math.ceil(m.width);
      const base = Math.ceil(m.actualBoundingBoxAscent) + 1;
      const h = base + Math.ceil(m.actualBoundingBoxDescent) + 1;
      if (w < 1 || h < 1) return FALLBACK;

      const canvas = ctx.canvas;
      canvas.width = w;
      canvas.height = h;
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${px}px ${style.fontFamily}`;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#fff";
      ctx.fillText(text, 0, base);

      const data = ctx.getImageData(0, 0, w, h).data;
      let row = -1;
      for (let y = 0; y < base && row < 0; y++) {
        let lit = 0;
        for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 24) lit++;
        if (lit / w >= COVERAGE) row = y;
      }
      if (row < 0) return FALLBACK;

      cacheKey = key;
      ratios = {
        top: (base - row) / px,
        bottom: m.actualBoundingBoxDescent / px,
        baseline:
          ((size * scale - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 +
            m.fontBoundingBoxAscent) /
          px,
      };
      return ratios;
    };

    const inkBox = (rect: DOMRect, style: CSSStyleDeclaration) => {
      const size = parseFloat(style.fontSize);
      const r = inkRatios(style);
      // the line box is a whole em tall and the glyphs sit centred inside it
      const baseline = rect.top + (rect.height - size) / 2 + r.baseline * size;
      return { top: baseline - r.top * size, bottom: baseline + r.bottom * size };
    };

    const measure = () => {
      queued = 0;
      const viewportH = document.documentElement.clientHeight;
      const wm = wordmark.getBoundingClientRect();
      const ink = inkBox(wm, getComputedStyle(wordmark));

      setChrome(Math.max(0, Math.round(probe.getBoundingClientRect().height - viewportH)));
      // the band only has to cover the wordmark — anything taller frosts bare
      // background, which is the whole of what it looked like on small screens.
      setBand(Math.max(0, Math.round(viewportH - ink.top)));

      let over = false;
      for (const el of document.querySelectorAll<HTMLElement>("[data-blog-link]")) {
        // the link's own box carries vertical padding; the text inside is what
        // has to be legible, so measure that.
        const rect = (el.firstElementChild ?? el).getBoundingClientRect();
        if (rect.bottom > ink.top && rect.top < ink.bottom) {
          over = true;
          break;
        }
      }
      setActive(over);
    };

    const schedule = () => {
      if (!queued) queued = requestAnimationFrame(measure);
    };

    measure();
    document.fonts?.ready.then(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(wordmark);

    return () => {
      if (queued) cancelAnimationFrame(queued);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      probe.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`blog-wordmark-blur${active ? " blog-wordmark-blur-active" : ""}`}
      style={
        {
          "--wordmark-band": `${band}px`,
          "--chrome-inset": `${chrome}px`,
        } as React.CSSProperties
      }
      aria-hidden
    />
  );
}
