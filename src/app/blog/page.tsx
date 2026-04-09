import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { BlogEntry } from "@/components/blog-entry";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "writing - peril.lol",
  openGraph: {
    title: "writing",
    images: [{ url: "/og/writing.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "writing",
    images: ["/og/writing.png"],
  },
};

export default function Blog() {
  const posts = getAllPosts();

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
            writing
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
            <span className="serif" style={{ color: "var(--color-dim)" }}>Writing</span>
          </div>

          <div className="max-w-[700px] pb-[30vh]">
            {posts.length === 0 ? (
              <p
                className="reveal reveal-d2 serif text-[clamp(16px,2.2vw,20px)] leading-[1.5]"
                style={{ color: "var(--color-secondary)" }}
              >
                nothing here yet.
              </p>
            ) : (
              <div>
                {posts.map((post, i) => (
                  <BlogEntry
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    date={post.date}
                    excerpt={post.excerpt}
                    revealClass={`reveal reveal-d${Math.min(i + 2, 3)}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
