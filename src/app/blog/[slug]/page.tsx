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
    <div className="min-h-[100dvh] flex flex-col px-[6vw] md:px-[8vw] pt-[10vh] md:pt-[14vh] pb-[4vh] relative">

      <div className="safari-tint-top" />
      <div className="safari-tint-bottom" />

      <div className="relative z-10">
        <div className="reveal reveal-d1 flex items-center gap-5 text-[clamp(14px,1.4vw,16px)] mb-[6vh]">
          <Link href="/" className="underline-link serif">Home</Link>
          <Link href="/blog" className="underline-link serif">Writing</Link>
        </div>

        <div className="max-w-[700px]">
          <div className="reveal reveal-d2 mb-[4vh]">
            <h1 className="serif text-[clamp(22px,3vw,34px)] leading-[1.4] tracking-[-0.01em] font-medium">
              {post.title}
            </h1>
            <span
              className="mono text-[clamp(10px,1vw,12px)] tabular-nums mt-2 block"
              style={{ color: "var(--color-dim)" }}
            >
              {post.date}
            </span>
          </div>

          <article
            className="reveal reveal-d3 serif text-[clamp(16px,1.8vw,19px)] leading-[1.8] tracking-[-0.005em]"
            style={{ color: "var(--color-text)" }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </div>
    </div>
  );
}
