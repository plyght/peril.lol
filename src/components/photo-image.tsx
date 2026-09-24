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
  const loadComplete = useRef<(() => void) | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
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
      onDone: (url) =>
        new Promise<void>((resolve) => {
          loadComplete.current = resolve;
          objectUrl = url;
          setResolved(url);
        }),
      onError: () => {
        setResolved(src);
      },
    });

    return () => {
      handle.cancel();
      loadComplete.current?.();
      loadComplete.current = null;
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
          onLoad={() => {
            setLoaded(true);
            loadComplete.current?.();
            loadComplete.current = null;
          }}
          onError={() => {
            setLoaded(true);
            loadComplete.current?.();
            loadComplete.current = null;
          }}
          className={`photo-img${loaded && (revealing || revealed) ? " photo-loaded" : ""}`}
        />
      )}
      {!revealed && (
        <AsciiReveal
          src={placeholder || resolved || ""}
          ready={loaded}
          onRevealStart={() => setRevealing(true)}
          onComplete={() => setRevealed(true)}
        />
      )}
    </a>
  );
}
