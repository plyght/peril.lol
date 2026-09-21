"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type RefObject } from "react";
import { requestImage } from "@/lib/image-loader";
import {
  analyzeImage,
  paletteFrom,
  type CoverAnalysis,
  type Palette,
} from "@/lib/palette";

import { AsciiReveal } from "./ascii-reveal";

// How far outside the text and the cover still counts as "on them", and how
// long the pointer has to cross the gap between the two.
const PAD = 16;
const GRACE_MS = 700;

const THEME_VARS: [keyof Palette, string][] = [
  ["bg", "--color-bg"],
  ["surface", "--color-surface"],
  ["border", "--color-border"],
  ["text", "--color-text"],
  ["secondary", "--color-secondary"],
  ["dim", "--color-dim"],
  ["accent", "--color-accent"],
  ["accentWash", "--color-accent-wash"],
];

function isDark(): boolean {
  return document.documentElement.dataset.theme !== "light";
}

function wearPalette(palette: Palette): void {
  const root = document.documentElement;
  for (const [key, prop] of THEME_VARS)
    root.style.setProperty(prop, palette[key]);
  root.classList.add("themed-by-cover");
}

function shedPalette(): void {
  const root = document.documentElement;
  for (const [, prop] of THEME_VARS) root.style.removeProperty(prop);
  root.classList.remove("themed-by-cover");
}

interface Point {
  x: number;
  y: number;
}

function inRect(rect: DOMRect, p: Point, pad: number): boolean {
  return (
    p.x >= rect.left - pad &&
    p.x <= rect.right + pad &&
    p.y >= rect.top - pad &&
    p.y <= rect.bottom + pad
  );
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/* Andrew's monotone chain — the hull of the exit point and the cover's corners. */
function hull(points: Point[]): Point[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const build = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (
        out.length >= 2 &&
        cross(out[out.length - 2], out[out.length - 1], p) <= 0
      )
        out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...build(pts), ...build([...pts].reverse())];
}

function insideHull(poly: Point[], p: Point): boolean {
  if (poly.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const c = cross(poly[i], poly[(i + 1) % poly.length], p);
    if (c === 0) continue;
    const s = c > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

export function NowPlayingArt({
  src,
  anchorRef,
  originRef,
  hidden,
  overflowing,
}: {
  src: string;
  anchorRef: RefObject<HTMLAnchorElement | null>;
  originRef: RefObject<HTMLSpanElement | null>;
  hidden: boolean;
  overflowing: boolean;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [resolved, setResolved] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [origin, setOrigin] = useState<{ left: number; top: number } | null>(
    null,
  );
  const analysisRef = useRef<CoverAnalysis | null>(null);
  const colorStartedRef = useRef(false);
  const hoveringRef = useRef(false);
  const pinnedRef = useRef(false);

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
      onError: () => {
        setResolved(src);
      },
    });

    return () => {
      handle.cancel();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  /*
    The art is portalled to the body and placed off the track line's own rect,
    since the bio column clips its overflow and the line rides its bottom edge.
    It sits off the right end of the text, its top flush with the text's own top
    so it never rises over the line. A track long enough to run to the fade edge
    leaves no room out there, so then it drops under the text instead, hung off
    the same right edge. Offsets are fractions of the line box, so they hold at
    any type size, and it never lands past the viewport.
  */
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;

    const place = () => {
      const line = originRef.current ?? el;
      const rect = line.getBoundingClientRect();
      const size = containerRef.current?.offsetWidth ?? 0;
      const margin = window.innerWidth * 0.04;
      const beside = rect.right + rect.height * 0.618;
      const fits = !overflowing && beside + size <= window.innerWidth - margin;

      const left = fits ? beside : Math.max(margin, rect.right - size);
      const top = fits ? rect.top : rect.bottom + rect.height * 0.382;

      setOrigin({
        left: Math.round(left),
        top: Math.round(Math.min(top, window.innerHeight - size - margin)),
      });
    };

    place();

    /*
      The cover sits diagonally off the end of the text, so a straight line to it
      leaves both. While the pointer is heading that way it stays inside the hull
      of where it left and the cover's own corners — a generous safe area, on a
      grace timer, so a slow or slightly wandering approach still arrives.
    */
    let bridge: Point[] | null = null;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    const clearGrace = () => {
      if (graceTimer) clearTimeout(graceTimer);
      graceTimer = null;
    };

    const show = () => {
      hoveringRef.current = true;
      setOpen(true);
      if (colorStartedRef.current && analysisRef.current)
        wearPalette(paletteFrom(analysisRef.current, isDark()));
    };

    const hide = () => {
      bridge = null;
      clearGrace();
      if (pinnedRef.current) return;
      hoveringRef.current = false;
      setOpen(false);
      shedPalette();
    };

    const enter = () => {
      bridge = null;
      clearGrace();
      place();
      show();
    };

    const move = (event: PointerEvent) => {
      if (!hoveringRef.current) return;
      const p = { x: event.clientX, y: event.clientY };
      const line = (originRef.current ?? el).getBoundingClientRect();
      const cover = containerRef.current?.getBoundingClientRect();

      if (inRect(line, p, PAD) || (cover && inRect(cover, p, PAD))) {
        bridge = null;
        clearGrace();
        return;
      }

      if (!cover) {
        hide();
        return;
      }

      if (!bridge) {
        bridge = hull([
          p,
          { x: cover.left, y: cover.top },
          { x: cover.right, y: cover.top },
          { x: cover.right, y: cover.bottom },
          { x: cover.left, y: cover.bottom },
        ]);
        clearGrace();
        graceTimer = setTimeout(hide, GRACE_MS);
        return;
      }

      if (!insideHull(bridge, p)) hide();
    };

    el.addEventListener("pointerenter", enter);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    window.addEventListener("resize", place);
    return () => {
      el.removeEventListener("pointerenter", enter);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("resize", place);
      clearGrace();
      shedPalette();
    };
  }, [anchorRef, originRef, overflowing]);

  /* Pinned, the scheme is held so it can be looked at properly. Escape drops it. */
  useEffect(() => {
    pinnedRef.current = pinned;
    if (!pinned) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPinned(false);
      setOpen(false);
      hoveringRef.current = false;
      shedPalette();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned]);

  const beginColor = () => {
    colorStartedRef.current = true;
    if (
      !hidden &&
      (hoveringRef.current || pinnedRef.current) &&
      analysisRef.current
    ) {
      wearPalette(paletteFrom(analysisRef.current, isDark()));
    }
  };

  if (!origin) {
    return <span ref={containerRef} className="np-art-probe" aria-hidden />;
  }

  const showing = (open || pinned) && !hidden;

  return createPortal(
    <span
      ref={containerRef}
      aria-hidden
      onClick={
        src
          ? () => {
              hoveringRef.current = true;
              setPinned((was) => !was);
            }
          : undefined
      }
      className={`np-art${revealed ? " np-art-revealed" : ""}${showing ? " np-art-open" : ""}${pinned ? " np-art-pinned" : ""}${
        src ? "" : " np-art-empty"
      }`}
      style={{
        left: `${origin.left}px`,
        top: `${origin.top}px`,
      }}
    >
      {/* Nothing to pull a sleeve from — a plain tile in the page's own colours,
          and the scheme stays where it is. */}
      {!src && <span className="np-art-note serif">♪</span>}
      {resolved && (
        <Image
          src={resolved}
          alt=""
          width={300}
          height={300}
          loading="eager"
          decoding="async"
          unoptimized
          onLoad={(event) => {
            setLoaded(true);
            analysisRef.current = analyzeImage(event.currentTarget);
          }}
          onError={() => setLoaded(true)}
          className={`np-art-img${loaded && (revealing || revealed) ? " np-art-img-loaded" : ""}`}
        />
      )}
      {src && !revealed && (
        <AsciiReveal
          src={resolved || ""}
          ready={loaded}
          active={showing}
          onColorStart={beginColor}
          onRevealStart={() => setRevealing(true)}
          onComplete={() => {
            beginColor();
            setRevealed(true);
          }}
        />
      )}
    </span>,
    document.body,
  );
}
