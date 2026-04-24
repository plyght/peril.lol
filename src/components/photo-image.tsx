"use client";

import Image from "next/image";
import { useState } from "react";

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
  const [loaded, setLoaded] = useState(false);

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className={`photo-container block${loaded ? " photo-container-loaded" : ""}`}
      style={placeholder ? { backgroundImage: `url(${placeholder})` } : undefined}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 640px) 88vw, (max-width: 1024px) 42vw, 28vw"
        placeholder={placeholder ? "blur" : "empty"}
        blurDataURL={placeholder || undefined}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`photo-img${loaded ? " photo-loaded" : ""}`}
      />
      <div className={`photo-reveal${loaded ? " photo-reveal-done" : ""}`} />
    </a>
  );
}
