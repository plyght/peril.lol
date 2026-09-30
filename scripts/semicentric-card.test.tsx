import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SemicentricCard } from "../src/components/semicentric-card";
import { artPosition } from "../src/components/now-playing-art";

describe("Semicentric card", () => {
  test("keeps the founder phrase as an ordinary external link with an accessible card description", () => {
    const markup = renderToStaticMarkup(<SemicentricCard />);
    expect(markup).toContain('href="https://semicentric.co"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain("Semicentric</span>");
    expect(markup).toContain("aria-describedby=");
    expect(markup).toContain("Semicentric business card:");
    expect(markup).toContain('class="np-art-probe"');
    expect(markup).not.toContain("<img");
  });
});

describe("hover artwork placement", () => {
  test("aligns the card below the navigation row on the left", () => {
    expect(
      artPosition(
        { right: 800, top: 300, bottom: 348, height: 48 },
        360,
        206,
        1280,
        800,
        false,
        102,
      ),
    ).toEqual({ left: 102, top: 356 });
  });
  test("keeps the music cover beside the text when there is room", () => {
    expect(
      artPosition(
        { right: 400, top: 200, bottom: 220, height: 20 },
        140,
        140,
        1200,
        800,
        false,
      ),
    ).toEqual({ left: 412, top: 200 });
  });

  test("uses rectangular card height rather than width at the viewport bottom", () => {
    expect(
      artPosition(
        { right: 950, top: 700, bottom: 730, height: 30 },
        350,
        200,
        1000,
        800,
        false,
      ),
    ).toEqual({ left: 600, top: 560 });
  });

  test("keeps wide mobile cards inside both viewport edges", () => {
    const position = artPosition(
      { right: 340, top: 700, bottom: 730, height: 30 },
      345,
      197,
      375,
      812,
      false,
    );
    expect(position).toEqual({ left: 15, top: 600 });
    expect(position.left + 345).toBeLessThanOrEqual(375 - 15);
    expect(position.top + 197).toBeLessThanOrEqual(812 - 15);
  });

  test("drops overflowing music titles below the line", () => {
    expect(
      artPosition(
        { right: 400, top: 200, bottom: 220, height: 20 },
        140,
        140,
        1200,
        800,
        true,
      ),
    ).toEqual({ left: 260, top: 228 });
  });
});
