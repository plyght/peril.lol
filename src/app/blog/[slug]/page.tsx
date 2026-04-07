import Link from "next/link";
import { getAllPosts, getPost } from "@/lib/blog";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "not found" };
  return { title: `${post.title} — peril.lol` };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-6 md:px-8 py-16 md:py-24">
      <div className="max-w-[520px] w-full space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[17px] tracking-tight"
            style={{
              fontFamily: "var(--font-eb-garamond), Georgia, serif",
              color: "var(--color-text)",
              textDecoration: "none",
            }}
          >
            plyght
          </Link>
          <Link
            href="/blog"
            className="text-[12px]"
            style={{ color: "var(--color-secondary)", textDecoration: "none" }}
          >
            back
          </Link>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h1
              className="text-[18px] font-medium"
              style={{ color: "var(--color-text)" }}
            >
              {post.title}
            </h1>
            <p className="text-[12px]" style={{ color: "var(--color-secondary)" }}>
              {post.date}
            </p>
          </div>

          <article
            className="text-[14px] leading-[1.8] space-y-4"
            style={{ color: "var(--color-text)" }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </div>
    </div>
  );
}
