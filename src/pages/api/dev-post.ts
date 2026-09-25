import type { NextApiRequest, NextApiResponse } from "next";
import { TLSSocket } from "node:tls";
import {
  DevPostError,
  saveDevPost,
  validateDevPostRequest,
} from "@/lib/dev-post-store";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  response.setHeader("Cache-Control", "no-store");
  if (process.env.NODE_ENV !== "development") {
    response.status(404).end();
    return;
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).end();
    return;
  }
  try {
    if (
      !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
        request.socket.remoteAddress ?? "",
      )
    ) {
      throw new DevPostError("Only loopback connections are allowed.", 403);
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (typeof value === "string") headers.set(name, value);
      else if (value) headers.set(name, value.join(", "));
    }
    const protocol =
      request.socket instanceof TLSSocket && request.socket.encrypted
        ? "https"
        : "http";
    const host = request.headers.host;
    if (!host) throw new DevPostError("Missing Host header.", 403);
    let localRequest;
    try {
      localRequest = new Request(`${protocol}://${host}/api/dev-post`, {
        headers,
      });
    } catch {
      throw new DevPostError("Invalid Host header.", 403);
    }
    validateDevPostRequest(localRequest);
    response.status(200).json(saveDevPost(request.body));
  } catch (error) {
    response.status(error instanceof DevPostError ? error.status : 500).json({
      error:
        error instanceof DevPostError ? error.message : "Could not save post.",
    });
  }
}
