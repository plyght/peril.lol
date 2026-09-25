import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "content/blog");
export const MAX_DEV_POST_BYTES = 1024 * 1024;

export class DevPostError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function revision(raw: string | Buffer): string {
  return createHash("sha256").update(raw).digest("hex");
}

function postPath(slug: string, directory: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(slug)) {
    throw new DevPostError("Invalid post slug.", 400);
  }
  const resolved = path.resolve(directory);
  let current = resolved;
  while (true) {
    if (fs.lstatSync(current).isSymbolicLink()) {
      throw new DevPostError("Symbolic links are not supported.", 400);
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const filename = path.join(resolved, `${slug}.md`);
  let stat;
  try {
    stat = fs.lstatSync(filename);
  } catch {
    throw new DevPostError("Post not found.", 404);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new DevPostError("Post must be a regular file.", 400);
  }
  return filename;
}

export function getDevPostRevision(slug: string, directory = postsDir): string {
  return revision(fs.readFileSync(postPath(slug, directory)));
}

export function validateDevPostRequest(request: Request): void {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !["http:", "https:"].includes(url.protocol) ||
    origin !== url.origin ||
    (request.headers.has("host") && request.headers.get("host") !== url.host)
  ) {
    throw new DevPostError(
      "Only same-origin localhost requests are allowed.",
      403,
    );
  }
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    throw new DevPostError("Expected application/json.", 415);
  }
  const length = request.headers.get("content-length");
  if (
    length &&
    (!/^\d+$/.test(length) || Number(length) > MAX_DEV_POST_BYTES)
  ) {
    throw new DevPostError("Request is too large.", 413);
  }
}

export function saveDevPost(
  payload: unknown,
  directory = postsDir,
): { revision: string } {
  if (!payload || typeof payload !== "object")
    throw new DevPostError("Invalid post.", 400);
  const {
    slug,
    title,
    content,
    revision: expected,
  } = payload as Record<string, unknown>;
  if (
    typeof slug !== "string" ||
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 500 ||
    /[\r\n\0]/.test(title) ||
    (content !== undefined &&
      (typeof content !== "string" ||
        Buffer.byteLength(content) > MAX_DEV_POST_BYTES ||
        content.includes("\0"))) ||
    typeof expected !== "string" ||
    !/^[a-f0-9]{64}$/.test(expected)
  )
    throw new DevPostError("Invalid post fields.", 400);
  const filename = postPath(slug, directory);
  const rawBytes = fs.readFileSync(filename);
  if (revision(rawBytes) !== expected)
    throw new DevPostError("Post changed on disk. Reload before saving.", 409);
  const raw = rawBytes.toString("utf8");
  if (!Buffer.from(raw).equals(rawBytes)) {
    throw new DevPostError("Post must contain valid UTF-8.", 400);
  }
  const match = raw.match(/^(---\r?\n)([\s\S]*?)(^---[ \t]*(?:\r?\n|$))/m);
  if (!match || match.index !== 0)
    throw new DevPostError("Unsupported frontmatter.", 400);
  let frontmatter = match[2];
  let data;
  try {
    data = matter(raw).data;
  } catch {
    throw new DevPostError("Invalid frontmatter.", 400);
  }
  if (title !== (data.title || slug)) {
    const lines = frontmatter.split(/(?<=\n)/);
    const titleIndex = lines.findIndex((line) => /^title[ \t]*:/.test(line));
    const newline = match[1].endsWith("\r\n") ? "\r\n" : "\n";
    if (titleIndex < 0) {
      if (Object.hasOwn(data, "title"))
        throw new DevPostError("Unsupported title format.", 400);
      frontmatter += `title: ${JSON.stringify(title)}${newline}`;
    } else {
      let singleTitle;
      try {
        singleTitle = matter(`---\n${lines[titleIndex]}---\n`).data.title;
      } catch {
        throw new DevPostError("Multiline titles cannot be changed.", 400);
      }
      if (
        singleTitle !== data.title ||
        /^[ \t]*[|>]/.test(lines[titleIndex].split(":").slice(1).join(":")) ||
        (lines[titleIndex + 1] && /^[ \t]+\S/.test(lines[titleIndex + 1]))
      ) {
        throw new DevPostError("Multiline titles cannot be changed.", 400);
      }
      lines[titleIndex] = `title: ${JSON.stringify(title)}${newline}`;
      frontmatter = lines.join("");
    }
  }
  const body = content === undefined ? raw.slice(match[0].length) : content;
  if (body && !match[3].endsWith("\n")) {
    throw new DevPostError("Frontmatter must end with a newline.", 400);
  }
  const updated = match[1] + frontmatter + match[3] + body;
  const temporary = path.join(
    path.dirname(filename),
    `.${slug}.${randomUUID()}.tmp`,
  );
  try {
    fs.writeFileSync(temporary, updated, {
      flag: "wx",
      mode: fs.statSync(filename).mode,
    });
    fs.renameSync(temporary, filename);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  return { revision: revision(updated) };
}
