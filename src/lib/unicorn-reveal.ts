type ArtworkCell = {
  x: number;
  y: number;
  color: string;
  alpha: number;
  delay: number;
  glyph: string;
};

export function sampleUnicornCells(
  pixels: Uint8ClampedArray,
  columns: number,
): ArtworkCell[] {
  const cells: ArtworkCell[] = [];
  const glyphs = ".:+*#@";
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3] / 255;
    if (alpha === 0) continue;
    const index = i / 4;
    cells.push({
      x: index % columns,
      y: Math.floor(index / columns),
      color: `rgb(${pixels[i]} ${pixels[i + 1]} ${pixels[i + 2]})`,
      alpha,
      delay: 50 + Math.random() * 150,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    });
  }
  return cells;
}

type UnicornReadiness = {
  initialized?: boolean;
  local?: { preloadedImages?: Record<string, { loading?: boolean }> };
  layers?: {
    visible?: boolean;
    isModel?: boolean;
    isFlattened?: boolean;
    layerType?: string;
    local?: { modelLoaded?: boolean; imageReady?: boolean; loaded?: boolean };
    areTextAssetsReady?: () => boolean;
    areImageAssetsReady?: () => boolean;
    areModelAssetsReady?: () => boolean;
  }[];
};

export function areUnicornAssetsReady(scene: UnicornReadiness): boolean {
  if (!scene.initialized || !scene.layers?.length) return false;
  if (
    Object.values(scene.local?.preloadedImages ?? {}).some(
      (image) => image.loading,
    )
  )
    return false;
  return scene.layers.every((layer) => {
    if (layer.visible === false) return true;
    if (layer.isModel && !layer.local?.modelLoaded) return false;
    if (layer.layerType === "image" && !layer.local?.imageReady) return false;
    if (layer.layerType === "text" && !layer.local?.loaded) return false;
    return (
      !layer.isFlattened ||
      !!(
        layer.areTextAssetsReady?.() &&
        layer.areImageAssetsReady?.() &&
        layer.areModelAssetsReady?.()
      )
    );
  });
}

export function revealUnicorn(
  scene: { renderFrame?: () => void; paused?: boolean },
  container: HTMLElement,
): () => void {
  const state = scene as UnicornReadiness;
  if (typeof state.initialized !== "boolean") return () => {};
  let frame = 0;
  let finished = false;
  let revealCleanup: (() => void) | undefined;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const started = performance.now();
  const cleanup = () => {
    finished = true;
    cancelAnimationFrame(frame);
    motion.removeEventListener("change", cleanup);
    window.removeEventListener("resize", cleanup);
    revealCleanup?.();
  };
  const ready = () => {
    if (finished) return;
    if (
      motion.matches ||
      !container.isConnected ||
      performance.now() - started > 10000
    ) {
      cleanup();
      return;
    }
    try {
      if (!areUnicornAssetsReady(state)) {
        frame = requestAnimationFrame(ready);
        return;
      }
    } catch {
      cleanup();
      return;
    }
    motion.removeEventListener("change", cleanup);
    window.removeEventListener("resize", cleanup);
    frame = requestAnimationFrame(() => {
      if (!finished) revealCleanup = revealReadyUnicorn(scene, container);
    });
  };
  motion.addEventListener("change", cleanup);
  window.addEventListener("resize", cleanup);
  ready();
  return cleanup;
}

function revealReadyUnicorn(
  scene: { renderFrame?: () => void; paused?: boolean },
  container: HTMLElement,
): () => void {
  let frame = 0;
  let overlay: HTMLCanvasElement | undefined;
  let source: HTMLCanvasElement | null = null;
  let observer: ResizeObserver | undefined;
  let motion: MediaQueryList | undefined;
  let originalPaused: boolean | undefined;
  let changedPause = false;
  let changedStyle = false;
  let finished = false;
  let opacity = "";
  let opacityPriority = "";
  let transition = "";
  let transitionPriority = "";
  let onResize: (() => void) | undefined;

  const cleanup = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    observer = undefined;
    motion?.removeEventListener("change", cleanup);
    motion = undefined;
    if (onResize) window.removeEventListener("resize", onResize);
    onResize = undefined;
    if (overlay) {
      overlay.remove();
      overlay.width = 0;
      overlay.height = 0;
      overlay = undefined;
    }
    if (source && changedStyle) {
      if (opacity)
        source.style.setProperty("opacity", opacity, opacityPriority);
      else source.style.removeProperty("opacity");
      if (transition)
        source.style.setProperty("transition", transition, transitionPriority);
      else source.style.removeProperty("transition");
    }
    if (changedPause) {
      try {
        scene.paused = originalPaused;
      } catch {}
    }
  };

  try {
    motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (
      motion.matches ||
      typeof scene.renderFrame !== "function" ||
      typeof scene.paused !== "boolean"
    )
      return cleanup;
    source = container.querySelector("canvas");
    if (!source || !source.width || !source.height) return cleanup;
    const bounds = source.getBoundingClientRect();
    const parentBounds = container.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return cleanup;
    const columns = Math.max(1, Math.min(96, Math.round(bounds.width / 6)));
    const rows = Math.max(
      1,
      Math.round((columns * bounds.height) / bounds.width),
    );
    const sampler = document.createElement("canvas");
    sampler.width = columns;
    sampler.height = rows;
    const sampleContext = sampler.getContext("2d", {
      willReadFrequently: true,
    });
    if (!sampleContext) return cleanup;
    if (typeof scene.paused === "boolean") {
      originalPaused = scene.paused;
      changedPause = true;
      scene.paused = true;
    }
    scene.renderFrame();
    sampleContext.drawImage(source, 0, 0, columns, rows);
    const cells = sampleUnicornCells(
      sampleContext.getImageData(0, 0, columns, rows).data,
      columns,
    );
    sampler.width = 0;
    sampler.height = 0;
    if (!cells.length) {
      cleanup();
      return cleanup;
    }
    overlay = document.createElement("canvas");
    overlay.setAttribute("aria-hidden", "true");
    const scale = Math.min(1, 560 / Math.max(bounds.width, bounds.height));
    overlay.width = Math.round(bounds.width * scale);
    overlay.height = Math.round(bounds.height * scale);
    Object.assign(overlay.style, {
      position: "absolute",
      left: `${bounds.left - parentBounds.left - container.clientLeft + container.scrollLeft}px`,
      top: `${bounds.top - parentBounds.top - container.clientTop + container.scrollTop}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      pointerEvents: "none",
      background: "transparent",
    });
    const context = overlay.getContext("2d");
    if (!context) {
      cleanup();
      return cleanup;
    }
    context.scale(scale, scale);
    const cellWidth = bounds.width / columns;
    const cellHeight = bounds.height / rows;
    context.font = `${cellHeight}px monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const foreground = getComputedStyle(container).color;
    const nativeOpacity = Number.parseFloat(getComputedStyle(source).opacity);
    opacity = source.style.getPropertyValue("opacity");
    opacityPriority = source.style.getPropertyPriority("opacity");
    transition = source.style.getPropertyValue("transition");
    transitionPriority = source.style.getPropertyPriority("transition");
    container.appendChild(overlay);
    changedStyle = true;
    source.style.setProperty("transition", "none", "important");
    source.style.setProperty("opacity", "0", "important");
    motion.addEventListener("change", cleanup);
    onResize = () => {
      const current = source!.getBoundingClientRect();
      const parent = container.getBoundingClientRect();
      if (
        Math.abs(current.width - bounds.width) > 0.5 ||
        Math.abs(current.height - bounds.height) > 0.5 ||
        Math.abs(
          current.left - parent.left - (bounds.left - parentBounds.left),
        ) > 0.5 ||
        Math.abs(current.top - parent.top - (bounds.top - parentBounds.top)) >
          0.5
      )
        cleanup();
    };
    window.addEventListener("resize", onResize);
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(onResize);
      observer.observe(source);
      observer.observe(container);
    }
    const start = performance.now();
    const duration = 1300 + Math.random() * 100;
    let lastDraw = -Infinity;
    const draw = (now: number) => {
      if (finished) return;
      try {
        if (!source!.isConnected || !container.isConnected || motion!.matches) {
          cleanup();
          return;
        }
        const elapsed = now - start;
        if (now - lastDraw < 1000 / 24 && elapsed < duration) {
          frame = requestAnimationFrame(draw);
          return;
        }
        lastDraw = now;
        const progress = Math.min(elapsed / duration, 1);
        context.clearRect(0, 0, bounds.width, bounds.height);
        for (const cell of cells) {
          const density = Math.min(
            1,
            Math.max(0, (elapsed + 35 - cell.delay) / (duration * 0.45)),
          );
          if (!density) continue;
          context.globalAlpha = cell.alpha * density;
          context.fillStyle =
            elapsed > duration * 0.4 + cell.delay ? cell.color : foreground;
          context.fillText(
            elapsed < duration * 0.22 + cell.delay ? "." : cell.glyph,
            (cell.x + 0.5) * cellWidth,
            (cell.y + 0.5) * cellHeight,
            cellWidth,
          );
        }
        const fade = Math.max(0, (progress - 0.64) / 0.36);
        const eased = 1 - (1 - fade) ** 3;
        source!.style.setProperty(
          "opacity",
          `${nativeOpacity * eased}`,
          "important",
        );
        overlay!.style.opacity = `${1 - eased}`;
        if (progress === 1) cleanup();
        else frame = requestAnimationFrame(draw);
      } catch {
        cleanup();
      }
    };
    draw(start);
  } catch {
    cleanup();
  }
  return cleanup;
}
