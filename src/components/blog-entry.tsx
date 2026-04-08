"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function BlogEntry({
  slug,
  title,
  date,
  excerpt,
  revealClass,
}: {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  revealClass: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [overlapping, setOverlapping] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      () => {
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const wordmarkTop = viewportH * 0.75;
        setOverlapping(rect.bottom > wordmarkTop && rect.top < viewportH);
      },
      { threshold: 0 }
    );

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const wordmarkTop = viewportH * 0.75;
      setOverlapping(rect.bottom > wordmarkTop && rect.top < viewportH);
    };

    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <Link
      ref={ref}
      href={`/blog/${slug}`}
      className={`${revealClass} group block py-[2.5vh] ${overlapping ? "blog-entry-blur" : ""}`}
      style={{ textDecoration: "none" }}
    >
      <span className="serif text-[clamp(22px,2.4vw,26px)] leading-[1.4] tracking-[-0.01em] underline-link">
        {title}
      </span>
      <div className="flex items-center gap-3 mt-1.5">
        <span
          className="mono text-[clamp(12px,1vw,13px)] tabular-nums"
          style={{ color: "var(--color-dim)" }}
        >
          {date}
        </span>
        {excerpt && (
          <>
            <span style={{ color: "var(--color-border)" }}>·</span>
            <span
              className="text-[clamp(14px,1.2vw,15px)]"
              style={{ color: "var(--color-secondary)" }}
            >
              {excerpt}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
