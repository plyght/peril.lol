import { getPageCount, getPostsForPage } from "@/lib/blog";
import { BlogPosts } from "@/components/blog-index";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamicParams = false;

export async function generateStaticParams() {
  return Array.from({ length: getPageCount() }, (_, i) => ({
    page: String(i + 1),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `writing · page ${page}`,
    description: "thoughts on code, training, and everything in between.",
    alternates: {
      canonical: page === "1" ? "/blog" : `/blog/p/${page}`,
    },
    openGraph: {
      title: `writing · page ${page}`,
      description: "thoughts on code, training, and everything in between.",
      images: [{ url: "/og/writing.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `writing · page ${page}`,
      description: "thoughts on code, training, and everything in between.",
      images: ["/og/writing.png"],
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const n = Number(page);
  const totalPages = getPageCount();
  if (!Number.isInteger(n) || n < 1 || n > totalPages) notFound();

  return <BlogPosts posts={getPostsForPage(n)} />;
}
