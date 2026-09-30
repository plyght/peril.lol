"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { requestImage } from "@/lib/image-loader";
import { AsciiReveal } from "./ascii-reveal";

export function MobileAlbumCover({ src }: { src: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [resolved, setResolved] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !src) return;

    let objectUrl: string | null = null;
    const handle = requestImage({
      el,
      src,
      onProgress: () => {},
      onDone: (url) => {
        objectUrl = url;
        setResolved(url);
      },
      onError: () => setResolved(src),
    });

    return () => {
      handle.cancel();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!src) return null;

  return (
    <span
      ref={containerRef}
      aria-hidden="true"
      className="relative block aspect-square min-w-[44px] max-w-[64px] flex-[1_0_44px] overflow-hidden rounded-[calc(100%/6.854)] [corner-shape:squircle] supports-[clip-path:border-box]:overflow-visible supports-[clip-path:border-box]:[clip-path:border-box] outline outline-1 -outline-offset-1 outline-white/10"
    >
      {!failed && resolved && (
        <Image
          src={resolved}
          alt=""
          width={64}
          height={64}
          loading="eager"
          unoptimized
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`block size-full object-cover ${loaded && (revealing || revealed) ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {!failed && !revealed && (
        <AsciiReveal
          src={resolved || ""}
          ready={loaded}
          onRevealStart={() => setRevealing(true)}
          onComplete={() => setRevealed(true)}
        />
      )}
    </span>
  );
}
