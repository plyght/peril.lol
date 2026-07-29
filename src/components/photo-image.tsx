"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { requestImage } from "@/lib/image-loader";

const MAX_BLUR = 26;
const HOLD_BLUR = 9;

function blurFor(progress: number): number {
  const eased = Math.pow(1 - Math.min(Math.max(progress, 0), 1), 1.6);
  return HOLD_BLUR + (MAX_BLUR - HOLD_BLUR) * eased;
}

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
  const [progress, setProgress] = useState(0);
  const [resolved, setResolved] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let objectUrl: string | null = null;
    const handle = requestImage({
      el,
      src,
      onProgress: setProgress,
      onDone: (url) => {
        objectUrl = url;
        setResolved(url);
      },
      onError: () => {
        setProgress(1);
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
        ...(placeholder ? { backgroundImage: `url(${placeholder})` } : undefined),
        ["--photo-blur" as string]: `${blurFor(progress).toFixed(2)}px`,
      }}
    >
      {resolved ? (
        <Image
          src={resolved}
          alt={alt}
          width={width}
          height={height}
          loading="eager"
          decoding="async"
          unoptimized
          onLoad={() => setLoaded(true)}
          className={`photo-img${loaded ? " photo-loaded" : ""}`}
        />
      ) : (
        <div className="photo-img" style={{ aspectRatio: `${width} / ${height}` }} />
      )}
      <div className={`photo-reveal${loaded ? " photo-reveal-done" : ""}`} />
    </a>
  );
}
