"use client";

import { useId, useRef, type RefObject } from "react";
import { NowPlayingArt } from "./now-playing-art";

export function SemicentricCard({
  placementRef,
  desktop = false,
}: {
  desktop?: boolean;
  placementRef?: RefObject<HTMLElement | null>;
}) {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const originRef = useRef<HTMLSpanElement>(null);
  const descriptionId = useId();

  return (
    <>
      <a
        ref={anchorRef}
        href="https://semicentric.co"
        target="_blank"
        rel="noopener noreferrer"
        className="underline-link"
        aria-describedby={descriptionId}
      >
        <span ref={originRef}>Semicentric</span>
        {desktop && (
          <NowPlayingArt
            src="/semicentric-business-card.svg?v=44e859641322"
            anchorRef={anchorRef}
            originRef={originRef}
            hidden={false}
            overflowing={false}
            variant="business-card"
            placementRef={placementRef}
          />
        )}
      </a>
      <span id={descriptionId} className="sr-only">
        Semicentric business card: I’m CEO, B*tch. plyght. Corporate
        headquarters. Washington, DC. email: plyght@semicentric.co.
      </span>
    </>
  );
}
