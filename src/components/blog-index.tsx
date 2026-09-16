import { BlogEntry } from "@/components/blog-entry";
import { WordmarkBlur } from "@/components/wordmark-blur";
import type { Post } from "@/lib/blog";

export function BlogPosts({ posts }: { posts: Post[] }) {
  return (
    <>
      <div
        className="fixed inset-0 flex flex-col justify-between overflow-hidden pointer-events-none select-none px-[6vw] md:px-[8vw] pb-[2vh]"
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

      <div className="relative z-10 max-w-[700px] mt-[6vh]">
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
                excerpt={post.excerpt}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
