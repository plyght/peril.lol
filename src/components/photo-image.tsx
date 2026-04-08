"use client";

import { useState, useRef, useEffect } from "react";

export function PhotoImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <div className="photo-container">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`photo-img${loaded ? " photo-loaded" : ""}`}
      />
      <div className={`photo-reveal${loaded ? " photo-reveal-done" : ""}`} />
    </div>
  );
}
