import fs from "fs";
import path from "path";
import sharp from "sharp";

const photosDir = path.join(process.cwd(), "public/photos");
const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

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
      if (meta.width && meta.height) {
        result[f] = { w: meta.width, h: meta.height };
      }
    } catch {
      result[f] = { w: 4, h: 3 };
    }
  }

  console.log(JSON.stringify(result));
}

main();
