"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const lines = [
  "took a wrong turn",
  "wandered off the path",
  "strayed too far",
  "lost in the void",
  "nothing lives here",
  "the page fled",
  "gone, like dust",
  "you weren't meant to see this",
  "even I don't know where this goes",
];

export default function NotFound() {
  const [line, setLine] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("no-scroll");
    setLine(lines[Math.floor(Math.random() * lines.length)]);
    return () => document.documentElement.classList.remove("no-scroll");
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col justify-between px-[6vw] md:px-[8vw] pt-[10vh] md:pt-[14vh] pb-[2vh] overflow-hidden relative">
      <div className="safari-tint-top" />
      <div className="safari-tint-bottom" />

      <div className="max-w-[700px] reveal reveal-d1 relative z-10">
        <p className="serif text-[clamp(24px,3vw,34px)] leading-[1.5] tracking-[-0.01em]" style={{ color: "var(--color-secondary)" }}>
          {line}
        </p>
        <div className="flex items-center gap-5 mt-6 text-[clamp(16px,1.4vw,18px)]">
          <Link href="/" className="underline-link serif">Return home</Link>
        </div>
      </div>

      <div className="reveal reveal-d2 select-none pointer-events-none leading-none relative z-10 mb-[-10vh]">
        <span
          className="serif font-bold tracking-[-0.05em] block"
          style={{
            fontSize: "clamp(140px, 28vw, 420px)",
            color: "var(--color-text)",
            opacity: 0.5,
          }}
        >
          404
        </span>
      </div>
    </div>
  );
}
