import Link from "next/link";

export function BlogEntry({
  slug,
  title,
  excerpt,
  index,
}: {
  slug: string;
  title: string;
  excerpt: string;
  index: number;
}) {
  return (
    <Link
      href={`/blog/${slug}`}
      data-blog-link
      className="group block py-[2.5vh]"
      style={{ textDecoration: "none" }}
    >
      <span
        className="reveal block"
        style={{ animationDelay: `${0.2 + index * 0.08}s` }}
      >
        <span className="serif text-[length:var(--text-entry-title)] leading-[1.4] tracking-[-0.01em] underline-link">
          {title}
        </span>
        {excerpt && (
          <span
            className="serif block mt-1.5 text-[length:var(--text-entry-excerpt)]"
            style={{ color: "var(--color-secondary)" }}
          >
            {excerpt}
          </span>
        )}
      </span>
    </Link>
  );
}
