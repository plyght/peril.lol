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
  expect(markup).toContain("[clip-path:border-box]");
  expect(markup).toContain('aria-hidden="true"');
  expect(markup).toContain("<canvas");
  expect(markup).not.toContain("<a ");
  expect(markup).not.toContain("<button");
});
