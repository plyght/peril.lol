export type MarkdownNode =
  | string
  | { tag: string; attrs?: Record<string, string>; children: MarkdownNode[] };

function escapeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[\\`*_\[\]<>]/g, "\\$&")
    .replace(/(^|\n)( {0,3})(#{1,6}(?=\s)|[-+](?=\s)|=+(?=\s*$))/g, "$1$2\\$3")
    .replace(/(^|\n)( {0,3}\d+)([.)])(?=\s)/g, "$1$2\\$3")
    .replace(/(^|\n)( {0,3})(-{3,})(?=\s*$)/g, "$1$2\\$3");
}

function rawText(node: MarkdownNode): string {
  return typeof node === "string" ? node : node.children.map(rawText).join("");
}

function codeText(node: MarkdownNode): string {
  if (typeof node === "string") return node;
  if (node.tag !== "code" && node.tag !== "span") {
    throw new Error("Unsupported content inside code.");
  }
  return node.children.map(codeText).join("");
}

function destination(value: string): string {
  if (
    /^[\s\S]*[\u0000-\u0020\u007f]/.test(value) ||
    /^(?!https?:|mailto:)[a-z][a-z\d+.-]*:/i.test(value)
  ) {
    throw new Error(
      "This post contains an unsafe link. Remove or change it before saving.",
    );
  }
  return `<${value.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\\/g, "%5C")}>`;
}

function render(node: MarkdownNode): string {
  if (typeof node === "string") return escapeText(node);
  const { tag, attrs = {}, children } = node;
  const classes = (attrs.class ?? "").split(/\s+/);
  if (classes.includes("cite-back")) return "";
  if (classes.includes("cite-ref")) {
    const citation = children.map(rawText).join("");
    if (!/^\[\d+\]$/.test(citation))
      throw new Error(
        "Use [number] for citations, or remove the citation before saving.",
      );
    return citation;
  }
  if (tag === "span") {
    const style = attrs.style ?? "";
    let wrapped = children;
    if (/(?:^|;)\s*font-style\s*:\s*(?:italic|oblique)\b/i.test(style)) {
      wrapped = [{ tag: "em", children: wrapped }];
    }
    if (/(?:^|;)\s*font-weight\s*:\s*(?:bold(?:er)?|[6-9]00)\b/i.test(style)) {
      wrapped = [{ tag: "strong", children: wrapped }];
    }
    return wrapped.map(render).join("");
  }
  if (tag === "pre") {
    const text = children.map(codeText).join("").replace(/\n$/, "");
    const fence = "`".repeat(
      Math.max(
        3,
        ...Array.from(text.matchAll(/`+/g), (match) => match[0].length + 1),
      ),
    );
    const code = children.find(
      (child) => typeof child !== "string" && child.tag === "code",
    );
    const language =
      typeof code === "object"
        ? (code.attrs?.class?.match(/(?:^|\s)language-([\w+-]+)/)?.[1] ?? "")
        : "";
    return `\n\n${fence}${language}\n${text}\n${fence}\n\n`;
  }
  if (tag === "code") {
    const text = children.map(codeText).join("").replace(/\n/g, " ");
    const fence = "`".repeat(
      Math.max(
        1,
        ...Array.from(text.matchAll(/`+/g), (match) => match[0].length + 1),
      ),
    );
    const padding =
      /^`|`$/.test(text) || (/^ .* $/.test(text) && !/^ +$/.test(text))
        ? " "
        : "";
    return `${fence}${padding}${text}${padding}${fence}`;
  }
  if (tag === "ul" || tag === "ol") {
    let index = Number(attrs.start ?? 1);
    if (!Number.isSafeInteger(index) || index < 0)
      throw new Error("Invalid ordered list start.");
    const items = children.filter(
      (child) => typeof child !== "string" || child.trim(),
    );
    return (
      "\n\n" +
      items
        .map((child) => {
          if (typeof child === "string" || child.tag !== "li")
            throw new Error("Unsupported content inside a list.");
          const marker = tag === "ol" ? `${index++}. ` : "- ";
          const body = child.children.map(render).join("").trim();
          return marker + body.replace(/\n/g, "\n" + " ".repeat(marker.length));
        })
        .join("\n") +
      "\n\n"
    );
  }
  if (tag === "article") {
    const blocks: string[] = [];
    let inline = "";
    const flush = () => {
      if (inline.trim()) blocks.push(inline.trim());
      inline = "";
    };
    for (const child of children) {
      if (
        typeof child !== "string" &&
        /^(p|div|h[1-6]|pre|ul|ol|blockquote|hr)$/.test(child.tag)
      ) {
        flush();
        const block = render(child).trim();
        if (block) blocks.push(block);
      } else {
        inline += render(child);
      }
    }
    flush();
    return blocks.join("\n\n");
  }
  const content = children.map(render).join("");
  if (/^h[1-6]$/.test(tag))
    return `\n\n${"#".repeat(Number(tag[1]))} ${content.trim()}\n\n`;
  switch (tag) {
    case "p":
    case "div":
      return `\n\n${content.trim()}\n\n`;
    case "strong":
    case "b":
    case "em":
    case "i": {
      const marker = tag === "strong" || tag === "b" ? "**" : "*";
      if (!content.trim()) return content;
      return content.replace(
        /^(\s*)([\s\S]*?)(\s*)$/,
        (_, before, text, after) =>
          `${before}${marker}${text}${marker}${after}`,
      );
    }
    case "a": {
      if (!attrs.href) return content;
      const title = attrs.title
        ? ` "${attrs.title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
        : "";
      return `[${content}](${destination(attrs.href)}${title})`;
    }
    case "blockquote":
      return (
        "\n\n" +
        content
          .trim()
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n") +
        "\n\n"
      );
    case "hr":
      return "\n\n---\n\n";
    case "br":
      return "  \n";
    default:
      throw new Error(
        `Cannot save <${tag}> content safely. Remove it or undo that change.`,
      );
  }
}

export function serializeMarkdown(node: MarkdownNode): string {
  return render(node).trim() + "\n";
}

export function markdownFromElement(element: HTMLElement): string {
  function read(node: Node): MarkdownNode {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE)
      throw new Error("Unsupported content in this post.");
    const el = node as HTMLElement;
    return {
      tag: el.tagName.toLowerCase(),
      attrs: Object.fromEntries(
        Array.from(el.attributes, (attr) => [attr.name, attr.value]),
      ),
      children: Array.from(el.childNodes, read),
    };
  }
  return serializeMarkdown(read(element));
}
