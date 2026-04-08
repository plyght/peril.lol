import fs from "fs";
import path from "path";
import sharp from "sharp";

const photosDir = path.join(process.cwd(), "public/photos");
const heicExts = new Set([".heic", ".heif"]);

async function main() {
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
    return;
  }

  const files = fs.readdirSync(photosDir);
  let converted = 0;

  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!heicExts.has(ext)) continue;

    const base = path.basename(f, ext);
    const outPath = path.join(photosDir, `${base}.webp`);
    if (fs.existsSync(outPath)) continue;

    try {
      await sharp(path.join(photosDir, f)).webp({ quality: 90 }).toFile(outPath);
      converted++;
      console.log(`converted ${f} -> ${base}.webp`);
    } catch (e) {
      console.error(`failed to convert ${f}:`, e);
    }
  }

  if (converted === 0) console.log("no heic files to convert");
}

main();
