import { getPageCount, getPostsForPage } from "@/lib/blog";
import { BlogIndex } from "@/components/blog-index";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "writing",
  description: "thoughts on code, training, and everything in between.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "writing",
    description: "thoughts on code, training, and everything in between.",
    images: [{ url: "/og/writing.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "writing",
    description: "thoughts on code, training, and everything in between.",
    images: ["/og/writing.png"],
  },
};

export default function Blog() {
  return (
    <BlogIndex posts={getPostsForPage(1)} page={1} totalPages={getPageCount()} />
  );
}
