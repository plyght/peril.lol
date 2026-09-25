"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageHref(page: number) {
  return page <= 1 ? "/blog" : `/blog/p/${page}`;
}

export function BlogNav({ totalPages }: { totalPages: number }) {
  const params = useParams<{ page?: string; slug?: string }>();
  const onPost = typeof params?.slug === "string";
  const page = Number(params?.page ?? 1) || 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="reveal reveal-d1 relative z-10 flex items-center gap-5 min-h-10 text-[clamp(20px,3vw,22px)] md:text-[clamp(16px,3vw,20px)]">
      <Link href="/" className="underline-link serif pointer-events-auto">
        Home
      </Link>
      {onPost ? (
        <Link href="/blog" className="underline-link serif pointer-events-auto">
          Writing
        </Link>
      ) : (
        <span className="serif" style={{ color: "var(--color-dim)" }}>
          Writing
        </span>
      )}
      {!onPost && totalPages > 1 && (
        <span
          className="blog-pager serif pointer-events-auto"
          aria-label="pagination"
        >
          {hasPrev ? (
            <Link
              href={pageHref(page - 1)}
              rel="prev"
              title="newer posts"
              aria-label="newer posts"
            >
              <ChevronLeft size={17} strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="blog-pager-off" aria-hidden="true">
              <ChevronLeft size={17} strokeWidth={1.75} />
            </span>
          )}
          {hasNext ? (
            <Link
              href={pageHref(page + 1)}
              rel="next"
              title="older posts"
              aria-label="older posts"
            >
              <ChevronRight size={17} strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="blog-pager-off" aria-hidden="true">
              <ChevronRight size={17} strokeWidth={1.75} />
            </span>
          )}
        </span>
      )}
    </div>
  );
}
