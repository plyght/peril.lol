import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

const WIDTH = 1200;
const HEIGHT = 630;

const root = join(import.meta.dir, "..");
const postsDir = join(root, "content/blog");
const ogDir = join(root, "public/og");

let fontRegular: ArrayBuffer;
let fontBold: ArrayBuffer;

async function loadFonts() {
  fontRegular = await fetch(
    "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf"
  ).then((r) => r.arrayBuffer());

  fontBold = await fetch(
    "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-DPNUAw.ttf"
  ).then((r) => r.arrayBuffer());
}

function getFonts() {
  return [
    { name: "EB Garamond", data: fontRegular, weight: 400 as const, style: "normal" as const },
    { name: "EB Garamond Bold", data: fontBold, weight: 700 as const, style: "normal" as const },
  ];
}

interface OgOptions {
  title?: string;
  bigText: string;
  bigTextSize?: string;
  bottomOffset?: string;
  outPath: string;
}

async function renderOg({ title, bigText, bigTextSize = "280px", bottomOffset = "20px", outPath }: OgOptions) {
  const children: any[] = [];

  if (title) {
    children.push({
      type: "div",
      props: {
        style: {
          fontFamily: "EB Garamond",
          fontSize: "48px",
          color: "#e8e8e8",
          lineHeight: 1.3,
          maxWidth: "900px",
        },
        children: title,
      },
    });
  }

  children.push({
    type: "span",
    props: {
      style: {
        fontFamily: "EB Garamond Bold",
        fontSize: bigTextSize,
        color: "#e8e8e8",
        opacity: 0.5,
        letterSpacing: "-0.05em",
        lineHeight: "0.8",
      },
      children: bigText,
    },
  });

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: title ? "space-between" : "flex-end",
          backgroundColor: "#0c0c0c",
          padding: title ? `60px 72px ${bottomOffset} 72px` : `0 0 ${bottomOffset} 72px`,
          overflow: "hidden",
        },
        children,
      },
    },
    { width: WIDTH, height: HEIGHT, fonts: getFonts() }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  const png = resvg.render().asPng();
  writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${png.byteLength} bytes)`);
}

const pages: OgOptions[] = [
  { bigText: "plyght", outPath: join(root, "public/og-image.png") },
  { bigText: "writing", outPath: join(ogDir, "writing.png") },
  { bigText: "404", bigTextSize: "420px", bottomOffset: "-60px", outPath: join(ogDir, "404.png") },
];

async function main() {
  await loadFonts();

  if (!existsSync(ogDir)) mkdirSync(ogDir, { recursive: true });

  for (const page of pages) {
    if (!existsSync(page.outPath)) {
      await renderOg(page);
    } else {
      console.log(`skip ${page.outPath} (already exists)`);
    }
  }

  if (!existsSync(postsDir)) {
    console.log("no blog posts found, skipping");
    return;
  }

  const files = readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  let generated = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const outPath = join(ogDir, `${slug}.png`);

    if (existsSync(outPath)) {
      console.log(`skip ${slug} (already exists)`);
      continue;
    }

    const raw = readFileSync(join(postsDir, file), "utf-8");
    const { data } = matter(raw);
    const title = data.title || slug;

    await renderOg({ title, bigText: "plyght", outPath });
    generated++;
  }

  console.log(`done: ${generated} new, ${files.length - generated} skipped`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
