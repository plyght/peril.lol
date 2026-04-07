import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "fs";
import { join } from "path";

const WIDTH = 1200;
const HEIGHT = 630;

async function main() {
  const fontRegular = await fetch(
    "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf"
  ).then((r) => r.arrayBuffer());

  const fontBold = await fetch(
    "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-DPNUAw.ttf"
  ).then((r) => r.arrayBuffer());

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundColor: "#0c0c0c",
          padding: "0 0 20px 72px",
          overflow: "hidden",
        },
        children: [
          {
            type: "span",
            props: {
              style: {
                fontFamily: "EB Garamond Bold",
                fontSize: "280px",
                color: "#e8e8e8",
                opacity: 0.5,
                letterSpacing: "-0.05em",
                lineHeight: "0.8",
              },
              children: "plyght",
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "EB Garamond", data: fontRegular, weight: 400, style: "normal" },
        { name: "EB Garamond Bold", data: fontBold, weight: 700, style: "normal" },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });
  const png = resvg.render().asPng();

  const out = join(import.meta.dir, "..", "public", "og-image.png");
  writeFileSync(out, png);
  console.log(`wrote ${out} (${png.byteLength} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
