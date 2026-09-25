import type { Metadata } from "next";
import { getAllPosts, getPost } from "@/lib/blog";
import { notFound } from "next/navigation";
import { CitationHandler } from "@/components/citation-handler";
import { DevPostEditor } from "@/components/dev-post-editor";
import { getDevPostRevision } from "@/lib/dev-post-store";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "not found" };
  return {
    title: post.title,
    description: post.excerpt ?? "",
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? "",
      type: "article",
      images: [{ url: `/og/${slug}.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? "",
      images: [`/og/${slug}.png`],
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    author: {
      "@type": "Person",
      name: "plyght",
      url: "https://peril.lol",
    },
    publisher: {
      "@type": "Person",
      name: "plyght",
      url: "https://peril.lol",
    },
    url: `https://peril.lol/blog/${slug}`,
    ...(post.excerpt ? { description: post.excerpt } : {}),
  };

  return (
    <div className="relative z-10 max-w-[700px] mt-[3vh] md:mt-[6vh] pb-[4vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="reveal reveal-d2 mb-[3vh] md:mb-[4vh]">
        <h1 className="serif text-[clamp(26px,5.5vw,38px)] md:text-[clamp(22px,5vw,34px)] leading-[1.3] tracking-[-0.015em] font-medium">
          {post.title}
        </h1>
      </div>

      <article
        className="reveal reveal-d3 serif text-[clamp(20px,18px+0.5vw,24px)] md:text-[clamp(16px,2.2vw,20px)] leading-[1.75] tracking-[-0.005em]"
        style={{ color: "var(--color-text)" }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      <CitationHandler />
      {process.env.NODE_ENV === "development" && (
        <DevPostEditor
          key={slug}
          slug={slug}
          revision={getDevPostRevision(slug)}
        />
      )}
    </div>
  );
}
