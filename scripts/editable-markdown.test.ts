import { describe, expect, test } from "bun:test";
import {
  serializeMarkdown,
  type MarkdownNode,
} from "../src/lib/editable-markdown";

const el = (
  tag: string,
  children: MarkdownNode[],
  attrs?: Record<string, string>,
): MarkdownNode => ({ tag, children, attrs });

describe("editable Markdown", () => {
  test("preserves basic formatting and escapes typed syntax", () => {
    expect(
      serializeMarkdown(
        el("p", [
          "Hello ",
          el("strong", ["world"]),
          " *literal* ",
          el("a", ["site"], { href: "https://example.com" }),
        ]),
      ),
    ).toBe("Hello **world** \\*literal\\* [site](<https://example.com>)\n");
  });
  test("preserves headings, quotes, breaks, and browser divs", () => {
    const value = serializeMarkdown(
      el("article", [
        el("h2", ["Title"]),
        el("blockquote", [el("p", ["Quote"])]),
        el("div", ["a", el("br", []), "b"]),
        el("hr", []),
      ]),
    );
    expect(value).toContain("## Title");
    expect(value).toContain("> Quote");
    expect(value).toContain("a  \nb");
    expect(value).toContain("---");
  });
  test("preserves nested lists and ordered start", () => {
    const value = serializeMarkdown(
      el(
        "ol",
        [
          el("li", ["one", el("ul", [el("li", ["nested"])])]),
          el("li", ["two"]),
        ],
        { start: "3" },
      ),
    );
    expect(value).toBe("3. one\n   \n   - nested\n4. two\n");
  });
  test("strips generated citation navigation only", () => {
    expect(
      serializeMarkdown(
        el("p", [
          "Claim ",
          el("a", [el("span", ["[2]"])], {
            class: "cite-ref",
            "data-source": "1",
          }),
          el("a", ["back"], { class: "cite-back" }),
        ]),
      ),
    ).toBe("Claim [2]\n");
  });
  test("uses safe fences for code", () => {
    expect(
      serializeMarkdown(
        el("pre", [el("code", ["const x = ```;\n"], { class: "language-js" })]),
      ),
    ).toBe("````js\nconst x = ```;\n````\n");
    expect(serializeMarkdown(el("code", ["a`b"]))).toBe("``a`b``\n");
  });
  test("rejects unsupported content and unsafe links", () => {
    expect(() =>
      serializeMarkdown(el("img", [], { src: "photo.jpg" })),
    ).toThrow("Cannot save <img>");
    expect(() =>
      serializeMarkdown(el("a", ["bad"], { href: "javascript:alert(1)" })),
    ).toThrow("unsafe link");
    expect(() =>
      serializeMarkdown(el("a", ["bad"], { href: "java\nscript:alert(1)" })),
    ).toThrow("unsafe link");
  });
  test("preserves punctuation and pasted newlines without creating Markdown blocks", () => {
    expect(
      serializeMarkdown(
        el("p", ["A well-made sentence. Yes!\n# literal\n1. literal\n---"]),
      ),
    ).toBe("A well-made sentence. Yes!\n\\# literal\n1\\. literal\n\\---\n");
  });
  test("preserves Enter-created divs and empty browser lines", () => {
    expect(
      serializeMarkdown(
        el("article", [
          "first",
          el("div", ["second"]),
          el("div", [el("br", [])]),
          el("div", ["third"]),
        ]),
      ),
    ).toContain("first\n\nsecond");
    expect(
      serializeMarkdown(
        el("article", [el("div", ["first", el("br", []), "second"])]),
      ),
    ).toBe("first  \nsecond\n");
  });
  test("rejects malformed edited citations and unsupported code content", () => {
    expect(() =>
      serializeMarkdown(
        el("a", ["changed"], { class: "cite-ref", "data-source": "1" }),
      ),
    ).toThrow("Use [number]");
    expect(() =>
      serializeMarkdown(el("pre", [el("code", [el("img", [])])])),
    ).toThrow("Unsupported content");
  });
  test("preserves text and semantic formatting in browser-styled deletion remnants", () => {
    expect(
      serializeMarkdown(
        el("article", [
          el(
            "p",
            [
              "Before ",
              el("span", ["remaining ", el("strong", ["bold"]), " text"], {
                style:
                  "color: rgb(232, 232, 232); font-family: Georgia; font-size: 20px; background-color: transparent;",
              }),
              " after.",
            ],
            { style: "line-height: 35px; text-align: start;" },
          ),
        ]),
      ),
    ).toBe("Before remaining **bold** text after.\n");
    expect(serializeMarkdown(el("span", ["plain"]))).toBe("plain\n");
    expect(
      serializeMarkdown(
        el("span", ["emphasis"], {
          style: "font-weight: 700; font-style: italic;",
        }),
      ),
    ).toBe("***emphasis***\n");
  });
  test("preserves styled code text without accepting unsupported embedded content", () => {
    expect(
      serializeMarkdown(
        el("pre", [
          el("code", [el("span", ["a\n\nb"], { style: "color: red" })], {
            style: "font-family: monospace;",
          }),
        ]),
      ),
    ).toBe("```\na\n\nb\n```\n");
    expect(serializeMarkdown(el("code", [el("span", ["a`b"])]))).toBe(
      "``a`b``\n",
    );
    expect(() =>
      serializeMarkdown(el("code", [el("span", [el("img", [])])])),
    ).toThrow("Unsupported content");
  });
  test("normalizes root block spacing without changing code whitespace", () => {
    expect(
      serializeMarkdown(
        el("article", [
          "\n",
          el("p", ["one"]),
          "\n",
          el("p", ["two"]),
          "\n",
          el("pre", [el("code", ["a\n\n\n\nb\n"])]),
        ]),
      ),
    ).toBe("one\n\ntwo\n\n```\na\n\n\n\nb\n```\n");
    expect(
      serializeMarkdown(
        el("article", [
          "text ",
          el("strong", ["bold"]),
          " tail",
          el("div", ["next"]),
        ]),
      ),
    ).toBe("text **bold** tail\n\nnext\n");
  });
});
