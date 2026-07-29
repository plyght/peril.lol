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

    const measure = () => {
      queued = 0;
      const viewportH = document.documentElement.clientHeight;
      const wm = wordmark.getBoundingClientRect();

      setChrome(Math.max(0, Math.round(probe.getBoundingClientRect().height - viewportH)));
      // the band only has to cover the wordmark — anything taller frosts bare
      // background, which is the whole of what it looked like on small screens.
      setBand(Math.max(0, Math.round(viewportH - wm.top)));

      let over = false;
      for (const el of document.querySelectorAll<HTMLElement>("[data-blog-link]")) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > wm.top && rect.top < wm.bottom) {
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
