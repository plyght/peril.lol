import Link from "next/link";
import { BlogEntry } from "@/components/blog-entry";
import { BlogPager } from "@/components/blog-pager";
import { WordmarkBlur } from "@/components/wordmark-blur";
import type { Post } from "@/lib/blog";

export function BlogShell({
  totalPages,
  children,
}: {
  totalPages: number;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-[100dvh] overflow-hidden">

      <div
        className="absolute inset-0 flex flex-col justify-between overflow-hidden pointer-events-none select-none px-[6vw] md:px-[8vw] pb-[2vh]"
        style={{ zIndex: 0 }}
      >
        <div />
        <div className="reveal reveal-d2 select-none leading-none mb-[1vh] md:mb-[-2vh]">
          <span
            data-blog-wordmark
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
        <div className="hidden md:contents">
          <WordmarkBlur />
        </div>
      </div>

      <div
        className="relative flex flex-col px-[6vw] md:px-[8vw]"
        style={{ zIndex: 1 }}
      >
        <div className="pt-[8vh] md:pt-[14vh]">
          <div className="reveal reveal-d1 flex items-center gap-5 text-[clamp(20px,3vw,22px)] md:text-[clamp(16px,3vw,20px)] mb-[6vh]">
            <Link href="/" className="underline-link serif pointer-events-auto">Home</Link>
            <span className="serif" style={{ color: "var(--color-dim)" }}>Writing</span>
            <BlogPager totalPages={totalPages} />
          </div>

          <div className="max-w-[700px]">{children}</div>
        </div>
        <div className="flex-1" />
      </div>
    </div>
  );
}

export function BlogPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <p
        className="reveal reveal-d2 serif text-[clamp(16px,2.2vw,20px)] leading-[1.5]"
        style={{ color: "var(--color-secondary)" }}
      >
        nothing here yet.
      </p>
    );
  }

  return (
    <div>
      {posts.map((post, i) => (
        <BlogEntry
          key={post.slug}
          slug={post.slug}
          title={post.title}
          excerpt={post.excerpt}
          index={i}
        />
      ))}
    </div>
  );
}
