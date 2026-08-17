import fs from "fs";
import path from "path";
import sharp from "sharp";

const photosDir = path.join(process.cwd(), "public/photos");
const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export function displayDimensions(metadata: {
  width?: number;
  height?: number;
  autoOrient?: { width: number; height: number };
}): { w: number; h: number } | null {
  const width = metadata.autoOrient?.width ?? metadata.width;
  const height = metadata.autoOrient?.height ?? metadata.height;
  return width && height ? { w: width, h: height } : null;
}

async function main() {
  if (!fs.existsSync(photosDir)) {
    console.log("{}");
    return;
  }

  const files = fs.readdirSync(photosDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return imageExts.has(ext) && !f.startsWith(".");
  });

  const result: Record<string, { w: number; h: number }> = {};

  for (const f of files) {
    try {
      const meta = await sharp(path.join(photosDir, f)).metadata();
      const dimensions = displayDimensions(meta);
      if (dimensions) result[f] = dimensions;
    } catch {
      result[f] = { w: 4, h: 3 };
    }
  }

  console.log(JSON.stringify(result));
}

if (import.meta.main) void main();
