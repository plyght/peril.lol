const MAX_CONCURRENT = 1;
const ROW_TOLERANCE = 96;
const VIEWPORT_MARGIN = 0.15;

export interface LoadHandle {
  cancel: () => void;
}

interface Entry {
  el: HTMLElement;
  src: string;
  onProgress: (progress: number) => void;
  onDone: (objectUrl: string) => void | Promise<void>;
  onError: () => void;
  cancelled: boolean;
  controller: AbortController;
}

const pending = new Set<Entry>();
let active = 0;
let pumpQueued = false;

function rank(entry: Entry): [number, number, number] {
  const rect = entry.el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const margin = vh * VIEWPORT_MARGIN;
  const top = rect.top + window.scrollY;
  const row = Math.floor(top / ROW_TOLERANCE);
  const left = rect.left + window.scrollX;

  if (rect.bottom > -margin && rect.top < vh + margin) return [0, row, left];
  if (rect.top >= vh + margin) return [1, row, left];
  return [2, -row, left];
}

function compare(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function pump(): void {
  while (active < MAX_CONCURRENT && pending.size > 0) {
    let best: Entry | null = null;
    let bestRank: [number, number, number] | null = null;

    for (const entry of pending) {
      const r = rank(entry);
      if (!bestRank || compare(r, bestRank) < 0) {
        best = entry;
        bestRank = r;
      }
    }

    if (!best || bestRank?.[0] !== 0) return;
    pending.delete(best);
    active += 1;
    void run(best);
  }
}

function schedulePump(): void {
  if (pumpQueued) return;
  pumpQueued = true;
  requestAnimationFrame(() => {
    pumpQueued = false;
    pump();
  });
}

async function run(entry: Entry): Promise<void> {
  let objectUrl: string | undefined;
  try {
    const response = await fetch(entry.src, {
      cache: "force-cache",
      signal: entry.controller.signal,
    });
    if (!response.ok || !response.body)
      throw new Error(String(response.status));

    const total = Number(response.headers.get("content-length")) || 0;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
        if (!entry.cancelled) {
          entry.onProgress(
            total > 0 ? Math.min(received / total, 1) : approximate(received),
          );
        }
      }
    }

    if (entry.cancelled) return;
    entry.onProgress(1);

    const type = response.headers.get("content-type") || "image/webp";
    objectUrl = URL.createObjectURL(new Blob(chunks as BlobPart[], { type }));
    const done = entry.onDone(objectUrl);
    objectUrl = undefined;
    await done;
  } catch {
    if (!entry.cancelled) entry.onError();
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    active -= 1;
    schedulePump();
  }
}

function approximate(received: number): number {
  return 1 - Math.exp(-received / 400_000);
}

export function requestImage(options: {
  el: HTMLElement;
  src: string;
  onProgress: (progress: number) => void;
  onDone: (objectUrl: string) => void | Promise<void>;
  onError: () => void;
}): LoadHandle {
  const entry: Entry = {
    ...options,
    cancelled: false,
    controller: new AbortController(),
  };
  pending.add(entry);
  schedulePump();

  return {
    cancel() {
      entry.cancelled = true;
      entry.controller.abort();
      pending.delete(entry);
    },
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("scroll", schedulePump, { passive: true });
  window.addEventListener("resize", schedulePump, { passive: true });
}
