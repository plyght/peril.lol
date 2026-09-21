"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { requestImage } from "@/lib/image-loader";

import { AsciiReveal } from "./ascii-reveal";

export function PhotoImage({
  src,
  alt,
  width,
  height,
  placeholder,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholder: string;
}) {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [resolved, setResolved] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let objectUrl: string | null = null;
    const handle = requestImage({
      el,
      src,
      onProgress: () => {},
      onDone: (url) => {
        objectUrl = url;
        setResolved(url);
      },
      onError: () => {
        setResolved(src);
      },
    });

    return () => {
      handle.cancel();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return (
    <a
      ref={containerRef}
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className={`photo-container block${loaded ? " photo-container-loaded" : ""}`}
      style={{
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {resolved && (
        <Image
          src={resolved}
          alt={alt}
          width={width}
          height={height}
          loading="eager"
          decoding="async"
          unoptimized
          style={{
            position: "absolute",
            inset: 0,
            height: "100%",
            objectFit: "cover",
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`photo-img${loaded ? " photo-loaded" : ""}`}
        />
      )}
      {!revealed && (
        <AsciiReveal
          src={placeholder || resolved || ""}
          ready={loaded}
          onComplete={() => setRevealed(true)}
        />
      )}
    </a>
  );
}
