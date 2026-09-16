"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageHref(page: number) {
  return page <= 1 ? "/blog" : `/blog/p/${page}`;
}

export function BlogPager({ totalPages }: { totalPages: number }) {
  const params = useParams<{ page?: string }>();
  const page = Number(params.page ?? 1) || 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (totalPages <= 1) return null;

  return (
    <span className="blog-pager serif pointer-events-auto" aria-label="pagination">
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
  );
}
