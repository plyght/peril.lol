import Link from "next/link";
import type { Metadata } from "next";
import { getAllVideos } from "@/lib/videos";
import { VideoPlayer } from "@/components/video-player";

export const metadata: Metadata = {
  title: "videos",
  description: "a collection of videos.",
  alternates: {
    canonical: "/videos",
  },
  openGraph: {
    title: "videos",
    description: "a collection of videos.",
    images: [{ url: "/og/videos.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "videos",
    description: "a collection of videos.",
    images: ["/og/videos.png"],
  },
};

export default function Videos() {
  const videos = getAllVideos();

  return (
    <div className="relative min-h-[100dvh]">

      <div
        className="sticky top-0 h-[100dvh] flex flex-col justify-between overflow-hidden pointer-events-none select-none px-[6vw] md:px-[8vw] pb-[2vh]"
        style={{ zIndex: 0 }}
      >
        <div />
        <div className="reveal reveal-d2 select-none leading-none mb-[1vh] md:mb-[-2vh]">
          <span
            className="serif font-bold tracking-[-0.05em] block"
            style={{
              fontSize: "clamp(110px, 25vw, 420px)",
              color: "var(--color-text)",
              opacity: 0.5,
            }}
          >
            videos
          </span>
        </div>
      </div>

      <div
        className="relative px-[6vw] md:px-[8vw]"
        style={{ zIndex: 1, marginTop: "-100dvh" }}
      >
        <div className="pt-[10vh] md:pt-[14vh]">
          <div className="reveal reveal-d1 flex items-center gap-5 text-[clamp(16px,3vw,20px)] mb-[6vh]">
            <Link href="/" className="underline-link serif pointer-events-auto">Home</Link>
            <span className="serif" style={{ color: "var(--color-dim)" }}>Videos</span>
          </div>

          {videos.length === 0 ? (
            <div className="max-w-[700px]">
              <p
                className="reveal reveal-d2 serif text-[clamp(16px,2.2vw,20px)] leading-[1.5]"
                style={{ color: "var(--color-secondary)" }}
              >
                nothing here yet.
              </p>
            </div>
          ) : (
            <div className="reveal reveal-d2 max-w-[900px] flex flex-col gap-8 pb-[30vh]">
              {videos.map((video, i) => (
                <VideoPlayer
                  key={i}
                  src={video.src}
                  poster={video.poster}
                  youtubeUrl={video.youtubeUrl}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
