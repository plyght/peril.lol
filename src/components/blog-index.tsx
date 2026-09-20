import { BlogEntry } from "@/components/blog-entry";
import type { Post } from "@/lib/blog";

export function BlogPosts({ posts }: { posts: Post[] }) {
  return (
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
  );
}
