import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import sharp from "sharp";

const photosDir = path.join(process.cwd(), "public/photos");
const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const heicExts = new Set([".heic", ".heif"]);

export interface Photo {
  src: string;
  filename: string;
  width: number;
  height: number;
  placeholder: string;
}

function ensureHeicConverted(): void {
  if (!fs.existsSync(photosDir)) return;

  const files = fs.readdirSync(photosDir);
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!heicExts.has(ext)) continue;

    const base = path.basename(f, ext);
    const outPath = path.join(photosDir, `${base}.webp`);
    if (fs.existsSync(outPath)) continue;

    try {
      execSync(`bun run scripts/convert-photos.ts`, { cwd: process.cwd(), stdio: "pipe" });
      break;
    } catch {
      break;
    }
  }
}

function getDimensions(): Record<string, { w: number; h: number }> {
  try {
    const result = execSync(`bun run scripts/photo-dimensions.ts`, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
    }).toString().trim();
    return JSON.parse(result);
  } catch {
    return {};
  }
}

async function getPlaceholder(filePath: string): Promise<string> {
  try {
    const buffer = await sharp(filePath)
      .rotate()
      .resize({ width: 24, height: 24, fit: "inside" })
      .blur(2)
      .webp({ quality: 35 })
      .toBuffer();
    return `data:image/webp;base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function getAllPhotos(): Promise<Photo[]> {
  if (!fs.existsSync(photosDir)) return [];

  ensureHeicConverted();

  const dims = getDimensions();

  const files = fs.readdirSync(photosDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return imageExts.has(ext) && !f.startsWith(".");
  });

  const photos = await Promise.all(
    files.map(async (f) => {
      const filePath = path.join(photosDir, f);
      const stat = fs.statSync(filePath);
      const d = dims[f] || { w: 4, h: 3 };
      return {
        src: `/photos/${f}`,
        filename: f,
        mtime: stat.mtimeMs,
        width: d.w,
        height: d.h,
        placeholder: await getPlaceholder(filePath),
      };
    }),
  );

  return photos
    .sort((a, b) => b.mtime - a.mtime)
    .map(({ src, filename, width, height, placeholder }) => ({ src, filename, width, height, placeholder }));
}
