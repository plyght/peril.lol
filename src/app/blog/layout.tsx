import { getPageCount } from "@/lib/blog";
import { BlogWordmark } from "@/components/blog-wordmark";
import { BlogNav } from "@/components/blog-nav";

export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col px-[6vw] md:px-[8vw] pt-[8vh] md:pt-[14vh]">
      <BlogWordmark />
      <BlogNav totalPages={getPageCount()} />
      {children}
    </div>
  );
}
