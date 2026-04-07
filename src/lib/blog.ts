import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDir = path.join(process.cwd(), "content/blog");

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDir)) return [];

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title || slug,
      date: data.date ? String(data.date).split("T")[0] : "",
      excerpt: data.excerpt || content.slice(0, 120) + "...",
      content,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPost(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const processed = await remark().use(html).process(content);

  return {
    slug,
    title: data.title || slug,
    date: data.date ? String(data.date).split("T")[0] : "",
    excerpt: data.excerpt ? String(data.excerpt) : "",
    content: processed.toString(),
  };
}
