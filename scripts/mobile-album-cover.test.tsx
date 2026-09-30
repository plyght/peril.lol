import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MobileAlbumCover } from "../src/components/mobile-album-cover";

test("omits missing album artwork", () => {
  expect(renderToStaticMarkup(<MobileAlbumCover src="" />)).toBe("");
});

test("reserves a flexible 44–64px decorative sleeve without an interactive element", () => {
  const markup = renderToStaticMarkup(
    <MobileAlbumCover src="https://example.com/cover.jpg" />,
  );
  expect(markup).toContain("min-w-[44px]");
  expect(markup).toContain("max-w-[64px]");
  expect(markup).toContain("flex-[1_0_44px]");
  expect(markup).toContain("rounded-[calc(100%/6.854)]");
  expect(markup).toContain("[corner-shape:squircle]");
  expect(markup).toContain("[&amp;&gt;canvas]:rounded-none");
  expect(markup).not.toContain("[&amp;&gt;canvas]:rounded-[inherit]");
  expect(markup).not.toContain("[&amp;&gt;canvas]:[corner-shape:inherit]");
  expect(markup).toContain("[&amp;&gt;img]:rounded-[inherit]");
  expect(markup).toContain("[&amp;&gt;img]:[corner-shape:inherit]");
  expect(markup).toContain("[clip-path:border-box]");
  expect(markup).toContain('aria-hidden="true"');
  expect(markup).toContain("<canvas");
  expect(markup).toContain("inset:-1px");
  expect(markup).toContain("width:calc(100% + 2px)");
  expect(markup).toContain("height:calc(100% + 2px)");
  expect(markup).toContain("outline-transparent");
  expect(markup).not.toContain("outline-white/10");
  expect(markup).not.toContain("<a ");
  expect(markup).not.toContain("<button");
});
