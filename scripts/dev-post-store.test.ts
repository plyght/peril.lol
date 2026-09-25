import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import handler, { config } from "../src/pages/api/dev-post";
import {
  DevPostError,
  getDevPostRevision,
  MAX_DEV_POST_BYTES,
  saveDevPost,
  validateDevPostRequest,
} from "../src/lib/dev-post-store";

let directory: string;
const original =
  '---\r\ntitle: "Original"\r\ndate: 2026-01-02\r\nexcerpt: Keep this\r\ntags: [a, b]\r\n---\r\nOld body\n';
beforeEach(() => {
  directory = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "dev-post-")),
  );
  fs.writeFileSync(path.join(directory, "post.md"), original);
});
afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));
function payload() {
  return {
    slug: "post",
    title: "Original",
    content: "New body\n",
    revision: getDevPostRevision("post", directory),
  };
}
function request(
  url = "http://localhost:3000/api/dev-post",
  origin: string | null = "http://localhost:3000",
  type = "application/json",
) {
  const headers = new Headers({ "content-type": type });
  if (origin !== null) headers.set("origin", origin);
  return new Request(url, { method: "POST", headers, body: "{}" });
}

describe("development post storage", () => {
  test("hashes all original bytes and preserves frontmatter exactly", () => {
    const input = payload();
    expect(input.revision).toBe(
      createHash("sha256").update(original).digest("hex"),
    );
    const result = saveDevPost(input, directory);
    expect(fs.readFileSync(path.join(directory, "post.md"), "utf8")).toBe(
      original.replace("Old body", "New body"),
    );
    expect(result.revision).toBe(getDevPostRevision("post", directory));
    expect(fs.readdirSync(directory)).toEqual(["post.md"]);
  });
  test("preserves raw body when content is omitted", () => {
    const input = payload();
    saveDevPost(
      { slug: input.slug, title: "Renamed", revision: input.revision },
      directory,
    );
    expect(fs.readFileSync(path.join(directory, "post.md"), "utf8")).toBe(
      original.replace('title: "Original"', 'title: "Renamed"'),
    );
  });
  test("changes only the title line and body", () => {
    const title = 'A "quote": value';
    saveDevPost({ ...payload(), title }, directory);
    expect(fs.readFileSync(path.join(directory, "post.md"), "utf8")).toBe(
      original
        .replace('title: "Original"', `title: ${JSON.stringify(title)}`)
        .replace("Old body", "New body"),
    );
  });
  test("rejects stale revisions without changing disk", () => {
    const input = payload();
    saveDevPost(input, directory);
    expect(() => saveDevPost(input, directory)).toThrow(DevPostError);
    try {
      saveDevPost(input, directory);
    } catch (error) {
      expect((error as DevPostError).status).toBe(409);
    }
    expect(fs.readFileSync(path.join(directory, "post.md"), "utf8")).toBe(
      original.replace("Old body", "New body"),
    );
  });
  test("rejects traversal, symlinks, and malformed fields", () => {
    for (const slug of ["../post", "/post", "post.md", "a/b", "", "post%2f"]) {
      expect(() => saveDevPost({ ...payload(), slug }, directory)).toThrow();
    }
    fs.symlinkSync(
      path.join(directory, "post.md"),
      path.join(directory, "linked.md"),
    );
    expect(() => getDevPostRevision("linked", directory)).toThrow();
    fs.symlinkSync(directory, path.join(directory, "linked-dir"));
    expect(() =>
      getDevPostRevision("post", path.join(directory, "linked-dir")),
    ).toThrow();
    for (const values of [
      { title: "" },
      { title: "a\nb" },
      { revision: "bad" },
      { content: 1 },
      { content: "x".repeat(MAX_DEV_POST_BYTES + 1) },
    ]) {
      expect(() =>
        saveDevPost({ ...payload(), ...values }, directory),
      ).toThrow();
    }
  });
  test("rejects invalid UTF-8 without changing bytes", () => {
    const bytes = Buffer.concat([Buffer.from(original), Buffer.from([0xff])]);
    fs.writeFileSync(path.join(directory, "post.md"), bytes);
    expect(() => saveDevPost(payload(), directory)).toThrow("UTF-8");
    expect(fs.readFileSync(path.join(directory, "post.md"))).toEqual(bytes);
  });
  test("preserves multiline titles unchanged and rejects changes", () => {
    const raw =
      "---\ntitle: >-\n  A multiline\n  title\ndate: 2026-01-02\n---\nBody";
    fs.writeFileSync(path.join(directory, "post.md"), raw);
    expect(() =>
      saveDevPost({ ...payload(), title: "Changed" }, directory),
    ).toThrow("Multiline");
    expect(fs.readFileSync(path.join(directory, "post.md"), "utf8")).toBe(raw);
    saveDevPost({ ...payload(), title: "A multiline title" }, directory);
    expect(fs.readFileSync(path.join(directory, "post.md"), "utf8")).toBe(
      raw.replace("Body", "New body\n"),
    );
  });
});

describe("local request validation", () => {
  test("accepts same-origin loopback hosts", () => {
    for (const host of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
      expect(() =>
        validateDevPostRequest(
          request(`http://${host}/api/dev-post`, `http://${host}`),
        ),
      ).not.toThrow();
    }
  });
  test("rejects absent origins, remote hosts, mismatched ports, and non-JSON", () => {
    for (const req of [
      request(undefined, null),
      request(undefined, "http://evil.test"),
      request(undefined, "http://localhost:3001"),
      request("http://evil.test/api/dev-post", "http://evil.test"),
      request(undefined, undefined, "text/plain"),
    ]) {
      expect(() => validateDevPostRequest(req)).toThrow();
    }
    const req = request();
    req.headers.set("host", "evil.test");
    req.headers.set("x-forwarded-host", "localhost:3000");
    expect(() => validateDevPostRequest(req)).toThrow();
  });
  test("limits declared payload sizes", () => {
    const req = request();
    req.headers.set("content-length", String(MAX_DEV_POST_BYTES + 1));
    expect(() => validateDevPostRequest(req)).toThrow();
  });
});

describe("development API gate", () => {
  function invoke(
    environment: string,
    method: string,
    remoteAddress: string | undefined = "127.0.0.1",
  ) {
    const previous = process.env.NODE_ENV;
    const result = {
      code: 0,
      headers: {} as Record<string, string>,
      body: undefined as unknown,
    };
    const response = {
      setHeader(name: string, value: string) {
        result.headers[name] = value;
        return response;
      },
      status(code: number) {
        result.code = code;
        return response;
      },
      end() {
        return response;
      },
      json(body: unknown) {
        result.body = body;
        return response;
      },
    };
    try {
      process.env.NODE_ENV = environment;
      handler(
        {
          method,
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3000",
            "content-type": "application/json",
          },
          socket: { remoteAddress },
          body: {},
        } as NextApiRequest,
        response as unknown as NextApiResponse,
      );
      return result;
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  }
  test("requires loopback connections even with local Host and Origin", () => {
    for (const address of ["192.168.1.10", "10.0.0.2", "2001:db8::1", ""]) {
      expect(invoke("development", "POST", address).code).toBe(403);
    }
    for (const address of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) {
      expect(invoke("development", "POST", address).code).toBe(400);
    }
    expect(invoke("production", "POST", "192.168.1.10").code).toBe(404);
  });
  test("returns 404 outside development", () => {
    expect(invoke("production", "POST").code).toBe(404);
    expect(invoke("test", "POST").code).toBe(404);
  });
  test("permits only POST and rejects invalid posts before writing", () => {
    expect(invoke("development", "GET").code).toBe(405);
    expect(invoke("development", "PUT").headers.Allow).toBe("POST");
    expect(invoke("development", "POST").code).toBe(400);
    expect(config.api.bodyParser.sizeLimit).toBe("1mb");
  });
});
