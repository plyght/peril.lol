import Link from "next/link";
import type { Metadata } from "next";
import { getAllPhotos } from "@/lib/photos";
import { PhotoImage } from "@/components/photo-image";

export const metadata: Metadata = {
  title: "photos - peril.lol",
  openGraph: {
    title: "photos",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "photos",
    images: ["/og-image.png"],
  },
};

export default function Photos() {
  const photos = getAllPhotos();

  return (
    <div className="relative min-h-[100dvh]">

      <div
        className="sticky top-0 h-[100dvh] flex flex-col overflow-hidden pointer-events-none select-none px-[6vw] md:px-[8vw]"
        style={{ zIndex: 0 }}
      >
        <div className="reveal reveal-d2 leading-none mt-auto mb-[calc(3vh-4px)] md:mb-[calc(1.2vh-0.5px)]">
          <span
            className="serif font-bold tracking-[-0.05em] block"
            style={{
              fontSize: "clamp(100px, 22vw, 320px)",
              color: "var(--color-text)",
              opacity: 0.5,
            }}
          >
            photos
          </span>
        </div>
      </div>

      <div
        className="relative px-[6vw] md:px-[8vw]"
        style={{ zIndex: 1, marginTop: "-100dvh" }}
      >
        <div className="pt-[10vh] md:pt-[14vh]">
          <div className="reveal reveal-d1 flex items-center gap-5 text-[clamp(16px,1.4vw,18px)] mb-[6vh]">
            <Link href="/" className="underline-link serif pointer-events-auto">Home</Link>
            <span className="serif" style={{ color: "var(--color-dim)" }}>Photos</span>
          </div>

          {photos.length === 0 ? (
            <div className="max-w-[700px]">
              <p
                className="reveal reveal-d2 serif text-[clamp(18px,1.6vw,20px)] leading-[1.5]"
                style={{ color: "var(--color-secondary)" }}
              >
                nothing here yet.
              </p>
            </div>
          ) : (
            <div className="reveal reveal-d2 columns-1 sm:columns-2 lg:columns-3 gap-4 pb-[30vh]">
              {photos.map((photo) => (
                <div key={photo.filename} className="mb-4 break-inside-avoid">
                  <PhotoImage src={photo.src} alt="" width={photo.width} height={photo.height} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
