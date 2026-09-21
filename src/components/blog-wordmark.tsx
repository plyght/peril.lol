"use client";

import { useParams } from "next/navigation";
import { WordmarkBlur } from "@/components/wordmark-blur";

export function BlogWordmark() {
  const params = useParams<{ slug?: string }>();

  return (
    <div
      className="fixed inset-0 flex flex-col justify-between overflow-hidden pointer-events-none select-none px-[6vw] md:px-[8vw] pb-[2vh]"
      style={{ zIndex: 0, display: params.slug ? "none" : undefined }}
    >
      <div />
      <div className="reveal reveal-d2 select-none leading-none mb-[1vh] md:mb-[-2vh]">
        <span
          data-blog-wordmark
          className="serif font-bold tracking-[-0.05em] block"
          style={{
            fontSize: "clamp(110px, 25vw, 420px)",
            color: "var(--color-text)",
            opacity: 0.5,
          }}
        >
          writing
        </span>
      </div>
      <div className="hidden md:contents">
        <WordmarkBlur />
      </div>
    </div>
  );
}
