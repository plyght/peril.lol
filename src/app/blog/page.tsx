import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "blog — peril.lol",
};

export default function Blog() {
  const posts = getAllPosts();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 md:px-8">
      <div className="max-w-[520px] w-full space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[17px] tracking-tight"
            style={{
              fontFamily: "var(--font-eb-garamond), Georgia, serif",
              color: "var(--color-text)",
              textDecoration: "none",
            }}
          >
            plyght
          </Link>
          <Link
            href="/"
            className="text-[12px]"
            style={{ color: "var(--color-secondary)", textDecoration: "none" }}
          >
            back
          </Link>
        </div>

        <div className="space-y-2">
          <h1
            className="text-[15px] font-medium"
            style={{ color: "var(--color-text)" }}
          >
            blog
          </h1>

          {posts.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--color-secondary)" }}>
              nothing here yet.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block group"
                  style={{ textDecoration: "none" }}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      className="text-[14px]"
                      style={{ color: "var(--color-text)" }}
                    >
                      {post.title}
                    </span>
                    <span
                      className="text-[11px] shrink-0"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      {post.date}
                    </span>
                  </div>
                  <p
                    className="text-[12px] mt-1"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
