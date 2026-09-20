type DebugEntry = Record<string, unknown>;

declare global {
  interface Window {
    __musicDebug?: DebugEntry[];
  }
}

let frame = 0;
let sequence = 0;

function enabled() {
  return new URLSearchParams(window.location.search).has("musicDebug");
}

function snapshot() {
  const root = document.documentElement;
  const body = document.body;
  const rootStyle = getComputedStyle(root);
  const bodyStyle = getComputedStyle(body);
  const overlay = getComputedStyle(body, "::before");
  const art = document.querySelector<HTMLElement>(".np-art");
  const image = art?.querySelector("img");
  const artStyle = art ? getComputedStyle(art) : null;
  return {
    at: Math.round(performance.now() * 10) / 10,
    themed: root.classList.contains("themed-by-cover"),
    rootBackground: rootStyle.backgroundColor,
    bodyBackground: bodyStyle.backgroundColor,
    paletteBackground: rootStyle.getPropertyValue("--color-bg").trim(),
    coverBackground: rootStyle.getPropertyValue("--cover-bg").trim(),
    overlayBackground: overlay.backgroundColor,
    overlayOpacity: overlay.opacity,
    overlayTransition: overlay.transition,
    artClass: art?.className,
    artBackground: artStyle?.backgroundColor,
    artOpacity: artStyle?.opacity,
    artFilter: artStyle?.filter,
    imageLoaded: image?.complete,
    imageOpacity: image ? getComputedStyle(image).opacity : null,
    imageFilter: image ? getComputedStyle(image).filter : null,
    trackClass: document.querySelector(".now-playing-desktop")?.className,
  };
}

function record(entry: DebugEntry) {
  const entries = (window.__musicDebug ??= []);
  entries.push(entry);
  if (entries.length > 250) entries.splice(0, entries.length - 250);
  console.info("[music-debug]", JSON.stringify(entry));
}

export function traceMusic(
  event: string,
  details: DebugEntry = {},
  sample = false,
) {
  if (!enabled()) return;
  record({ event, ...details, ...snapshot() });
  if (!sample) return;
  cancelAnimationFrame(frame);
  const id = ++sequence;
  const start = performance.now();
  const frames: ReturnType<typeof snapshot>[] = [];
  let last = -Infinity;
  const capture = (now: number) => {
    if (now - last >= 30) {
      frames.push(snapshot());
      last = now;
    }
    if (now - start < 1200) {
      frame = requestAnimationFrame(capture);
    } else {
      frame = 0;
      record({ event: "frames", trigger: event, sequence: id, frames });
    }
  };
  frame = requestAnimationFrame(capture);
}

export function startMusicDebug() {
  if (!enabled()) return;
  traceMusic("debug-ready", {
    version: "cover-crossfade-1",
    dark: matchMedia("(prefers-color-scheme: dark)").matches,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    userAgent: navigator.userAgent,
  });
  const observer = new MutationObserver(() => traceMusic("root-style-change"));
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class", "data-theme"],
  });
  const transition = (event: TransitionEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.matches("html, body, .np-art, .np-art-img")) return;
    traceMusic(event.type, {
      target: target.tagName + "." + target.className,
      property: event.propertyName,
      pseudo: event.pseudoElement,
      elapsed: event.elapsedTime,
    });
  };
  const events = [
    "transitionrun",
    "transitionstart",
    "transitionend",
    "transitioncancel",
  ] as const;
  for (const event of events) document.addEventListener(event, transition);
  return () => {
    traceMusic("debug-unmount");
    observer.disconnect();
    for (const event of events) document.removeEventListener(event, transition);
    cancelAnimationFrame(frame);
  };
}
