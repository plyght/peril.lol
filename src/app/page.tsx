"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    UnicornStudio?: { isInitialized?: boolean; init: () => void };
  }
}

export default function Home() {
  useEffect(() => {
    if (window.UnicornStudio?.isInitialized) {
      window.UnicornStudio.init();
    }
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col justify-between px-[6vw] md:px-[8vw] pt-[6vh] md:pt-[8vh] pb-[2vh] overflow-hidden relative">

      <div
        className="absolute pointer-events-none -top-[5%] -right-[10%] md:-top-[8%] md:-right-[4%]"
        style={{ width: "clamp(280px, 65vw, 720px)", height: "clamp(280px, 65vw, 720px)" }}
        data-us-project="IYyOoRrLn7Kydgb9Pmkw"
      />

      <div className="max-w-[700px] reveal reveal-d1 relative z-10">
        <p className="serif text-[clamp(22px,3vw,34px)] leading-[1.5] tracking-[-0.01em]">
          High school junior out of D.C.{" "}
          <em className="font-semibold">Developer</em>,{" "}
          <em className="font-semibold">wrestler</em>,{" "}
          <em className="font-semibold">philosopher</em>.
          {" "}Currently at{" "}
          <a href="https://semicentric.co" target="_blank" rel="noopener noreferrer" className="underline-link">Semicentric</a>
          {" "}doing low level infra.
          {" "}I made{" "}
          <a href="https://github.com/plyght/spine" target="_blank" rel="noopener noreferrer" className="underline-link">Spine</a>,{" "}
          <a href="https://github.com/plyght/skew" target="_blank" rel="noopener noreferrer" className="underline-link">Skew</a>,{" "}
          <a href="https://github.com/plyght/wax" target="_blank" rel="noopener noreferrer" className="underline-link">Wax</a>, and{" "}
          <a href="https://github.com/plyght/anchor" target="_blank" rel="noopener noreferrer" className="underline-link">Anchor</a>.
        </p>
        <div className="flex items-center gap-5 mt-6 text-[clamp(14px,1.4vw,16px)]">
          <Link href="/blog" className="underline-link serif">Writing</Link>
          <a href="https://github.com/plyght" target="_blank" rel="noopener noreferrer" className="underline-link serif">GitHub</a>
          <a href="https://x.com/inaplight" target="_blank" rel="noopener noreferrer" className="underline-link serif">X</a>
          <a href="mailto:plyght@peril.lol" className="underline-link serif">Contact</a>
        </div>
      </div>

      <div className="reveal reveal-d2 select-none pointer-events-none leading-none relative z-10">
        <span
          className="serif font-bold tracking-[-0.05em] block"
          style={{
            fontSize: "clamp(140px, 28vw, 420px)",
            color: "var(--color-text)",
            opacity: 0.5,
          }}
        >
          plyght
        </span>
      </div>

      <Script
        src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.6/dist/unicornStudio.umd.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.UnicornStudio) window.UnicornStudio.init();
        }}
      />
    </div>
  );
}
