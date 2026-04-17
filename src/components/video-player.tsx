"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, Volume1, VolumeX, Loader2, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

function SeekSlider({
  value,
  buffered,
  onChange,
  className,
}: {
  value: number;
  buffered: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full h-1 bg-white/20 rounded-full cursor-pointer",
        className
      )}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        onChange(Math.min(Math.max(percentage, 0), 100));
      }}
    >
      <div
        className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
        style={{ width: `${buffered}%`, transition: "width 0.3s ease-out" }}
      />
      <div
        className="absolute top-0 left-0 h-full bg-white rounded-full"
        style={{ width: `${value}%`, transition: "width 0.15s linear" }}
      />
    </div>
  );
}

function VolumeSlider({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const calcValue = (clientX: number) => {
    if (!sliderRef.current) return value;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.min(Math.max((x / rect.width) * 100, 0), 100);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(calcValue(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    onChange(calcValue(e.clientX));
  };

  return (
    <div
      ref={sliderRef}
      className={cn(
        "relative w-full h-3 flex items-center cursor-pointer touch-none",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div className="relative w-full h-1 bg-white/20 rounded-full">
        <div
          className="absolute top-0 left-0 h-full bg-white rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center w-9 h-9 rounded-md text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
    >
      {children}
    </button>
  );
}

export function VideoPlayer({
  src,
  poster,
  youtubeUrl,
}: {
  src: string;
  poster?: string;
  youtubeUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const [volumeHover, setVolumeHover] = useState(false);
  const titleContainerRef = useRef<HTMLSpanElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!youtubeUrl) return;
    const cached = sessionStorage.getItem(`yt_title_${youtubeUrl}`);
    if (cached) {
      setVideoTitle(cached);
      return;
    }
    fetch(`https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.title) {
          setVideoTitle(data.title);
          sessionStorage.setItem(`yt_title_${youtubeUrl}`, data.title);
        }
      })
      .catch(() => {});
  }, [youtubeUrl]);

  useEffect(() => {
    if (!videoTitle || !titleTextRef.current || !titleContainerRef.current) {
      setNeedsMarquee(false);
      return;
    }
    const check = () => {
      if (titleTextRef.current && titleContainerRef.current) {
        setNeedsMarquee(
          titleTextRef.current.scrollWidth > titleContainerRef.current.clientWidth + 2
        );
      }
    };
    const raf = requestAnimationFrame(check);
    const timer = setTimeout(check, 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [videoTitle, showControls, volumeHover]);

  const updateBuffered = useCallback(() => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const buf = videoRef.current.buffered;
    if (buf.length > 0) {
      const end = buf.end(buf.length - 1);
      setBuffered((end / videoRef.current.duration) * 100);
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        setHasPlayed(true);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      const newVolume = value / 100;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const prog =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isFinite(prog) ? prog : 0);
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
      updateBuffered();
    }
  };

  const handleSeek = (value: number) => {
    if (videoRef.current && videoRef.current.duration) {
      const time = (value / 100) * videoRef.current.duration;
      if (isFinite(time)) {
        videoRef.current.currentTime = time;
        setProgress(value);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden bg-black/60 backdrop-blur-sm"
      style={{ aspectRatio: "16 / 9" }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onTimeUpdate={handleTimeUpdate}
        onProgress={updateBuffered}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onSeeking={() => setIsBuffering(true)}
        onSeeked={() => setIsBuffering(false)}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        onClick={togglePlay}
      />

      <AnimatePresence>
        {isBuffering && isPlaying && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && !hasPlayed && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={togglePlay}
          >
            <Play className="h-10 w-10 text-white/70" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && hasPlayed && (
          <motion.div
            className="absolute bottom-0 mx-auto max-w-xl left-0 right-0 p-4 m-2 bg-black/60 backdrop-blur-md rounded-2xl"
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/70 text-sm tabular-nums">
                {formatTime(currentTime)}
              </span>
              <SeekSlider
                value={progress}
                buffered={buffered}
                onChange={handleSeek}
                className="flex-1"
              />
              <span className="text-white/70 text-sm tabular-nums">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <IconButton onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </IconButton>
                <div
                  className="flex items-center gap-x-1 -my-2 py-2 -mr-3 pr-3"
                  onMouseEnter={() => setVolumeHover(true)}
                  onMouseLeave={() => setVolumeHover(false)}
                >
                  <IconButton onClick={toggleMute}>
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : volume > 0.5 ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <Volume1 className="h-5 w-5" />
                    )}
                  </IconButton>
                  <div className="video-volume-slider" style={{ width: volumeHover ? 100 : 0 }}>
                    <VolumeSlider
                      value={volume * 100}
                      onChange={handleVolumeChange}
                    />
                  </div>
                </div>
              </div>
              {videoTitle && (
                <span
                  ref={titleContainerRef}
                  className={`video-title-container${needsMarquee ? " video-title-overflow" : ""}`}
                >
                  <span
                    ref={titleTextRef}
                    className={`video-title-inner${needsMarquee ? " marquee" : ""}`}
                  >
                    {videoTitle}{needsMarquee && <>&nbsp;&nbsp;&nbsp;&nbsp;</>}
                    {needsMarquee && <>{videoTitle}&nbsp;&nbsp;&nbsp;&nbsp;</>}
                  </span>
                </span>
              )}
              {youtubeUrl && (
                <div className="shrink-0 ml-auto">
                  <IconButton onClick={() => window.open(youtubeUrl, "_blank")}>
                    <ArrowUpRight className="h-5 w-5" />
                  </IconButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
