"use client";

import { useEffect, useState } from "react";

export function WordmarkBlur() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const update = () => {
      const viewportH = window.innerHeight;
      const wordmarkTop = viewportH * 0.75;
      const links = document.querySelectorAll<HTMLElement>("[data-blog-link]");
      let over = false;
      for (const el of links) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > wordmarkTop && rect.top < viewportH) {
          over = true;
          break;
        }
      }
      setActive(over);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className={`blog-wordmark-blur${active ? " blog-wordmark-blur-active" : ""}`}
      aria-hidden
    />
  );
}
