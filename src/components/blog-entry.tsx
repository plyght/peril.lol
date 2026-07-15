"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function BlogEntry({
  slug,
  title,
  excerpt,
  revealClass,
}: {
  slug: string;
  title: string;
  excerpt: string;
  revealClass: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [overlapping, setOverlapping] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    console.log(`[blur-debug] "${title}" mounted`, {
      supportsBackdrop: CSS.supports("backdrop-filter", "blur(16px)"),
      supportsWebkitBackdrop: CSS.supports("-webkit-backdrop-filter", "blur(16px)"),
    });
    const before = getComputedStyle(el, "::before");
    console.log(`[blur-debug] "${title}" ::before computed`, {
      backdropFilter: before.backdropFilter,
      webkitBackdropFilter: (before as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter,
      background: before.background,
      opacity: before.opacity,
      content: before.content,
      zIndex: before.zIndex,
      position: before.position,
    });

    const observer = new IntersectionObserver(
      () => {
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const wordmarkTop = viewportH * 0.75;
        setOverlapping(rect.bottom > wordmarkTop && rect.top < viewportH);
      },
      { threshold: 0 }
    );

    let lastLogged: boolean | null = null;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const wordmarkTop = viewportH * 0.75;
      const next = rect.bottom > wordmarkTop && rect.top < viewportH;
      if (next !== lastLogged) {
        lastLogged = next;
        const before = getComputedStyle(el, "::before");
        console.log(`[blur-debug] "${title}" overlapping=${next}`, {
          hasBlurClass: el.classList.contains("blog-entry-blur"),
          beforeOpacity: before.opacity,
          beforeBackdrop: before.backdropFilter,
          rectBottom: Math.round(rect.bottom),
          wordmarkTop: Math.round(wordmarkTop),
        });
      }
      setOverlapping(next);
    };

    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [title]);

  return (
    <Link
      ref={ref}
      href={`/blog/${slug}`}
      className={`blog-entry group block py-[2.5vh] ${overlapping ? "blog-entry-blur" : ""}`}
      style={{ textDecoration: "none" }}
    >
      <span className={`${revealClass} block`}>
        <span className="serif text-[clamp(22px,2.4vw,26px)] leading-[1.4] tracking-[-0.01em] underline-link">
          {title}
        </span>
        {excerpt && (
          <span
            className="serif block mt-1.5 text-[clamp(15px,1.5vw,17px)]"
            style={{ color: "var(--color-secondary)" }}
          >
            {excerpt}
          </span>
        )}
      </span>
    </Link>
  );
}
