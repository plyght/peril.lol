import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDir = path.join(process.cwd(), "content/blog");

function linkifyCitations(rawHtml: string): string {
  const lastOlStart = rawHtml.lastIndexOf("<ol>");
  const lastOlEnd = rawHtml.lastIndexOf("</ol>");
  if (lastOlStart === -1 || lastOlEnd === -1) return rawHtml;

  const beforeSources = rawHtml.slice(0, lastOlStart);
  if (!beforeSources.includes("<strong>Sources:")) return rawHtml;

  const sourcesBlock = rawHtml.slice(lastOlStart, lastOlEnd + 5);
  const sourceItems = sourcesBlock.match(/<li>/g);
  if (!sourceItems) return rawHtml;
  const sourceCount = sourceItems.length;

  const validNums = new Set(
    Array.from({ length: sourceCount }, (_, i) => i + 1)
  );

  let srcIdx = 0;
  const taggedSources = sourcesBlock.replace(/<li>/g, () => {
    srcIdx++;
    return `<li id="source-${srcIdx}"><a href="#ref-${srcIdx}-1" class="cite-back" data-source="${srcIdx}"><span class="cite-bracket">[</span><span class="cite-num">${srcIdx}</span><span class="cite-bracket">]</span></a> `;
  });

  const occurrences: Record<number, number> = {};
  const body = rawHtml.slice(0, lastOlStart).replace(/\[(\d+)\]/g, (match, num) => {
    const n = parseInt(num, 10);
    if (!validNums.has(n)) return match;
    occurrences[n] = (occurrences[n] || 0) + 1;
    const k = occurrences[n];
    return `<a href="#source-${n}" id="ref-${n}-${k}" class="cite-ref" data-source="${n}"><span class="cite-bracket">[</span><span class="cite-num">${n}</span><span class="cite-bracket">]</span></a>`;
  });

  return body + taggedSources + rawHtml.slice(lastOlEnd + 5);
}

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
    content: linkifyCitations(processed.toString()),
  };
}
