import type { MetadataRoute } from "next";
import { getAllPosts, getPageCount } from "@/lib/blog";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://peril.lol/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const pageEntries: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, getPageCount() - 1) },
    (_, i) => ({
      url: `https://peril.lol/blog/p/${i + 2}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    })
  );

  return [
    {
      url: "https://peril.lol",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://peril.lol/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://peril.lol/photos",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...pageEntries,
    ...blogEntries,
  ];
}
