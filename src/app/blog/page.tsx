import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "writing | peril.lol",
};

export default function Blog() {
  const posts = getAllPosts();

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between px-[6vw] md:px-[8vw] pt-[10vh] md:pt-[14vh] pb-[2vh] relative">

      <div className="safari-tint-top" />
      <div className="safari-tint-bottom" />

      <div className="relative z-10">
        <div className="reveal reveal-d1 flex items-center gap-5 text-[clamp(14px,1.4vw,16px)] mb-[6vh]">
          <Link href="/" className="underline-link serif">Home</Link>
          <span className="serif" style={{ color: "var(--color-dim)" }}>Writing</span>
        </div>

        <div className="max-w-[700px]">
          {posts.length === 0 ? (
            <p
              className="reveal reveal-d2 serif text-[clamp(18px,2.4vw,28px)] leading-[1.5]"
              style={{ color: "var(--color-secondary)" }}
            >
              nothing here yet.
            </p>
          ) : (
            <div>
              {posts.map((post, i) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={`reveal reveal-d${Math.min(i + 2, 3)} group block py-[2.5vh]`}
                  style={{
                    textDecoration: "none",
                  }}
                >
                  <span className="serif text-[clamp(18px,2.4vw,26px)] leading-[1.4] tracking-[-0.01em] underline-link">
                    {post.title}
                  </span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span
                      className="mono text-[clamp(10px,1vw,12px)] tabular-nums"
                      style={{ color: "var(--color-dim)" }}
                    >
                      {post.date}
                    </span>
                    {post.excerpt && (
                      <>
                        <span style={{ color: "var(--color-border)" }}>·</span>
                        <span
                          className="text-[clamp(12px,1.2vw,14px)]"
                          style={{ color: "var(--color-secondary)" }}
                        >
                          {post.excerpt}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="reveal reveal-d2 select-none pointer-events-none leading-none relative z-10 mb-[-2vh]">
        <span
          className="serif font-bold tracking-[-0.05em] block"
          style={{
            fontSize: "clamp(100px, 22vw, 320px)",
            color: "var(--color-text)",
            opacity: 0.5,
          }}
        >
          writing
        </span>
      </div>
    </div>
  );
}
