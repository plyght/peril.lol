import { getPageCount } from "@/lib/blog";
import { BlogShell } from "@/components/blog-index";

export default function BlogIndexLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BlogShell totalPages={getPageCount()}>{children}</BlogShell>;
}
