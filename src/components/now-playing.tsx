"use client";

import { useEffect, useState } from "react";
import { AsciiBars } from "./ascii-bars";

interface Track {
  name: string;
  artist: string;
  url: string;
  image: string;
  playing: boolean;
}

const LASTFM_USER = "plyght_";
const LASTFM_API_KEY = "";

export function NowPlaying() {
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (!LASTFM_API_KEY) return;

    async function fetchTrack() {
      try {
        const res = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
        );
        const data = await res.json();
        const recent = data.recenttracks?.track?.[0];
        if (recent) {
          setTrack({
            name: recent.name,
            artist: recent.artist["#text"],
            url: recent.url,
            image: recent.image?.[1]?.["#text"] || "",
            playing: recent["@attr"]?.nowplaying === "true",
          });
        }
      } catch {
        // silently fail
      }
    }

    fetchTrack();
    const interval = setInterval(fetchTrack, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!track) return null;

  return (
    <a
      href={track.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3"
      style={{ textDecoration: "none" }}
    >
      {track.image && (
        <img
          src={track.image}
          alt=""
          className="w-8 h-8 rounded"
          style={{
            border: "1px solid var(--color-border)",
            filter: "grayscale(0.3)",
          }}
        />
      )}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {track.playing && <AsciiBars />}
          <span className="text-[12px]" style={{ color: "var(--color-text)" }}>
            {track.name}
          </span>
        </div>
        <span className="text-[11px] mono" style={{ color: "var(--color-dim)" }}>
          {track.artist}
        </span>
      </div>
    </a>
  );
}
