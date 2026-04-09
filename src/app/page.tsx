"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized?: boolean;
      init: () => void;
      addScene: (opts: Record<string, unknown>) => Promise<{ destroy: () => void }>;
    };
  }
}

export default function Home() {
  const sceneRef = useRef<{ destroy: () => void } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<{ track: string; artist: string; live: boolean } | null>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const [wordmarkWidth, setWordmarkWidth] = useState(0);
  const bioRef = useRef<HTMLDivElement>(null);
  const [bioWidth, setBioWidth] = useState(0);

  const fetchNowPlaying = useCallback(async (skipCache = false) => {
    try {
      const cacheKey = "lastfm_now_playing";
      const cacheTimeKey = "lastfm_now_playing_ts";
      if (!skipCache) {
        const cached = sessionStorage.getItem(cacheKey);
        const cachedTs = sessionStorage.getItem(cacheTimeKey);
        if (cached && cachedTs && Date.now() - Number(cachedTs) < 30000) {
          setNowPlaying(JSON.parse(cached));
          return;
        }
      }
      const res = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=plyght_&api_key=cd6b695e7b06661c8e90bdf322d8b7e2&format=json&limit=1`
      );
      const data = await res.json();
      const track = data?.recenttracks?.track?.[0];
      if (track) {
        const live = track["@attr"]?.nowplaying === "true";
        const np = { track: track.name, artist: track.artist["#text"], live };
        setNowPlaying(np);
        sessionStorage.setItem(cacheKey, JSON.stringify(np));
        sessionStorage.setItem(cacheTimeKey, String(Date.now()));
      } else {
        setNowPlaying(null);
        sessionStorage.removeItem(cacheKey);
      }
    } catch {
      setNowPlaying(null);
    }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(() => fetchNowPlaying(true), 30000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  useEffect(() => {
    if (!nowPlaying || !textRef.current || !containerRef.current) {
      setNeedsMarquee(false);
      return;
    }
    const check = () => {
      if (textRef.current && containerRef.current) {
        setNeedsMarquee(textRef.current.scrollWidth > containerRef.current.clientWidth + 10);
      }
    };
    const timer = setTimeout(check, 600);
    return () => clearTimeout(timer);
  }, [nowPlaying]);


  useEffect(() => {
    if (!wordmarkRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setWordmarkWidth(entry.contentRect.width);
    });
    ro.observe(wordmarkRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!bioRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setBioWidth(entry.contentRect.width);
    });
    ro.observe(bioRef.current);
    return () => ro.disconnect();
  }, []);


  useEffect(() => {
    document.documentElement.classList.add("no-scroll");
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => {
      document.documentElement.classList.remove("no-scroll");
      mq.removeEventListener("change", handler);
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isDesktop && window.UnicornStudio && !sceneRef.current) {
      initScene();
    }
  }, [isDesktop]);

  const initScene = () => {
    if (!window.UnicornStudio) return;
    if (sceneRef.current) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    window.UnicornStudio.addScene({
      elementId: "unicorn-container",
      projectId: "IYyOoRrLn7Kydgb9Pmkw",
      scale: 1,
      dpi: 1.5,
      fps: 60,
      lazyLoad: true,
      production: true,
    }).then((scene) => {
      sceneRef.current = scene;
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col justify-between px-[6vw] md:px-[8vw] pt-[10vh] md:pt-[14vh] pb-[2vh] overflow-hidden relative">

      
      <div ref={bioRef} className="max-w-[700px] reveal reveal-d1 relative z-10 overflow-hidden">
        <p className="serif text-[clamp(22px,5vw,34px)] leading-[1.5] tracking-[-0.01em]">
          High school junior out of D.C.{" "}
          <em className="font-semibold">Developer</em>,{" "}
          <em className="font-semibold">wrestler</em>,{" "}
          <em className="font-semibold">photographer</em>.
          {" "}Currently at{" "}
          <a href="https://semicentric.co" target="_blank" rel="noopener noreferrer" className="underline-link">Semicentric</a>
          {" "}doing low level infra.
          {" "}I made{" "}
          <a href="https://github.com/plyght/spine" target="_blank" rel="noopener noreferrer" className="underline-link">Spine</a>,{" "}
          <a href="https://github.com/plyght/skew" target="_blank" rel="noopener noreferrer" className="underline-link">Skew</a>,{" "}
          <a href="https://github.com/plyght/wax" target="_blank" rel="noopener noreferrer" className="underline-link">Wax</a>, and{" "}
          <a href="https://github.com/plyght/angel" target="_blank" rel="noopener noreferrer" className="underline-link">Angel</a>.
        </p>
        <div className="flex flex-wrap items-center gap-5 mt-6 text-[clamp(16px,3vw,20px)]">
          <Link href="/blog" className="underline-link serif">Writing</Link>
          <Link href="/photos" className="underline-link serif">Photos</Link>
          <a href="https://github.com/plyght" target="_blank" rel="noopener noreferrer" className="underline-link serif">GitHub</a>
          <a href="https://x.com/inaplight" target="_blank" rel="noopener noreferrer" className="underline-link serif">X</a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText("plyght@peril.lol");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`${copied ? "" : "underline-link"} serif contact-copy`}
          >
            <span className={copied ? "copy-text copy-text-out" : "copy-text copy-text-in"}>Contact</span>
            <span className={copied ? "copy-text copy-text-in" : "copy-text copy-text-out"}>Copied</span>
          </button>
          {isDesktop && (
            <a
              href="https://www.last.fm/user/plyght_"
              target="_blank"
              rel="noopener noreferrer"
              className="now-playing now-playing-desktop serif"
              style={bioWidth ? { "--bio-w": `${bioWidth}px` } as React.CSSProperties : undefined}
            >
              <span className="now-playing-icon">♪</span>
              {nowPlaying && (
                <span
                  className={`now-playing-text now-playing-loaded${!nowPlaying.live ? " now-playing-dim" : ""}`}
                  ref={containerRef}
                >
                  <span className={`now-playing-inner${needsMarquee ? " marquee" : ""}`} ref={textRef}>
                    {!nowPlaying.live && "last played · "}{nowPlaying.track} · {nowPlaying.artist}
                    {needsMarquee && <>&nbsp;&nbsp;&nbsp;&nbsp;{!nowPlaying.live && "last played · "}{nowPlaying.track} · {nowPlaying.artist}</>}
                  </span>
                </span>
              )}
            </a>
          )}
        </div>
      </div>

      {isDesktop && (
        <div
          id="unicorn-container"
          className="reveal reveal-d1 pointer-events-none absolute -top-[8%] -right-[4%] w-[clamp(240px,50vw,560px)] h-[clamp(240px,50vw,560px)]"
        />
      )}

      {!isDesktop && (
        <a
          href="https://www.last.fm/user/plyght_"
          target="_blank"
          rel="noopener noreferrer"
          className="now-playing now-playing-mobile serif reveal reveal-d2"
          style={wordmarkWidth ? { "--wordmark-w": `${wordmarkWidth}px` } as React.CSSProperties : undefined}
        >
          <span className="now-playing-icon">♪</span>
          {nowPlaying && (
            <span
              className={`now-playing-text now-playing-loaded${!nowPlaying.live ? " now-playing-dim" : ""}`}
            >
              <span className="now-playing-inner">
                {!nowPlaying.live && "last played · "}{nowPlaying.track} · {nowPlaying.artist}
              </span>
            </span>
          )}
        </a>
      )}

      <div className="reveal reveal-d2 select-none pointer-events-none leading-none relative z-10 mb-[1vh] md:mb-[-2vh]">
        <span
          ref={wordmarkRef}
          className="serif font-bold tracking-[-0.05em] inline-block"
          style={{
            fontSize: "clamp(110px, 25vw, 420px)",
            color: "var(--color-text)",
            opacity: 0.5,
          }}
        >
          plyght
        </span>
      </div>

      {isDesktop && (
        <Script
          src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.6/dist/unicornStudio.umd.js"
          strategy="afterInteractive"
          onLoad={initScene}
        />
      )}
    </div>
  );
}
