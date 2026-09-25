"use client";

import { useEffect, useRef, useState } from "react";
import { Comet } from "loading-dev";
import { Check, Redo2, Undo2 } from "lucide-react";
import { markdownFromElement } from "@/lib/editable-markdown";

export function DevPostEditor({
  slug,
  revision,
}: {
  slug: string;
  revision: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const initialRevision = useRef(revision);
  const retry = useRef<() => void>(() => {});
  const historyAction = useRef<(command: "undo" | "redo") => void>(() => {});
  const [history, setHistory] = useState<{
    undo: boolean;
    redo: boolean;
  } | null>(null);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname))
      return;
    const parent = root.current?.parentElement;
    const title = parent?.querySelector<HTMLElement>("h1");
    const article = parent?.querySelector<HTMLElement>("article");
    if (!title || !article) return;
    let titleHtml = title.innerHTML;
    let articleHtml = article.innerHTML;
    let currentRevision = initialRevision.current;
    let saving = false;
    let composing = false;
    let blocked = false;
    let conflict = false;
    let leaving = false;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const previous = [title, article].map((element) => ({
      element,
      attrs: [
        "contenteditable",
        "role",
        "aria-label",
        "aria-multiline",
        "style",
      ].map((name) => [name, element.getAttribute(name)] as const),
    }));
    let editRange: Range | null = null;
    let editTarget = article;
    const updateHistory = () => {
      if (!alive) return;
      const selection = window.getSelection();
      const anchor = selection?.anchorNode;
      if (anchor && (title.contains(anchor) || article.contains(anchor))) {
        editTarget = title.contains(anchor) ? title : article;
        if (selection.rangeCount)
          editRange = selection.getRangeAt(0).cloneRange();
      }
      const next = {
        undo: !!editRange && document.queryCommandEnabled("undo"),
        redo: !!editRange && document.queryCommandEnabled("redo"),
      };
      setHistory((previous) =>
        previous?.undo === next.undo && previous.redo === next.redo
          ? previous
          : next,
      );
    };
    const dirty = () =>
      title.innerHTML !== titleHtml || article.innerHTML !== articleHtml;
    const schedule = () => {
      clearTimeout(timer);
      if (blocked || composing || !alive || leaving || !dirty()) return;
      if (!saving) setStatus("Unsaved");
      timer = setTimeout(() => void save(), 700);
    };
    async function save() {
      clearTimeout(timer);
      if (
        !alive ||
        saving ||
        composing ||
        blocked ||
        leaving ||
        !dirty() ||
        !title ||
        !article
      )
        return;
      const nextTitleHtml = title.innerHTML;
      const nextArticleHtml = article.innerHTML;
      try {
        const text = title.innerText.trim();
        if (!text || /[\r\n]/.test(text))
          throw new Error("Use a nonempty, single-line title.");
        const content =
          nextArticleHtml === articleHtml
            ? undefined
            : markdownFromElement(article);
        saving = true;
        setStatus("Saving…");
        setFailed(false);
        const response = await fetch("/api/dev-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            title: text,
            content,
            revision: currentRevision,
          }),
        });
        const result = await response.json();
        if (response.status === 409) conflict = true;
        if (!response.ok)
          throw new Error(
            response.status === 409
              ? "File changed on disk. Copy your edits before reloading."
              : result.error || "Save failed. Your edits are still here.",
          );
        if (typeof result.revision !== "string")
          throw new Error(
            "Invalid server response. Your edits are still here.",
          );
        currentRevision = result.revision;
        initialRevision.current = result.revision;
        titleHtml = nextTitleHtml;
        articleHtml = nextArticleHtml;
        if (alive) setStatus(dirty() ? "Unsaved" : "Saved");
      } catch (error) {
        blocked = true;
        if (alive) {
          setFailed(true);
          setStatus(
            error instanceof Error
              ? error.message
              : "Save failed. Your edits are still here.",
          );
        }
      } finally {
        saving = false;
        if (alive && !blocked && dirty()) schedule();
      }
    }
    retry.current = () => {
      articleHtml = "";
      blocked = false;
      conflict = false;
      setFailed(false);
      void save();
    };
    const input = () => {
      updateHistory();
      if (blocked && !conflict) {
        blocked = false;
        setFailed(false);
      }
      schedule();
    };
    historyAction.current = (command) => {
      if (!editRange || !alive || composing || leaving) return;
      editTarget.focus({ preventScroll: true });
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(editRange);
      document.execCommand(command);
      input();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (leaving || (!dirty() && !saving)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const confirmLeave = () => {
      if (leaving || (!dirty() && !saving)) return true;
      if (!window.confirm("Some edits have not saved. Leave this page?"))
        return false;
      leaving = true;
      clearTimeout(timer);
      return true;
    };
    const navigation = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (
        !link ||
        article.contains(link) ||
        title.contains(link) ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        link.getAttribute("target") === "_blank"
      )
        return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const blockLinks = (event: MouseEvent) => {
      event.stopPropagation();
      if ((event.target as Element).closest?.("a")) event.preventDefault();
    };
    const paste = (event: ClipboardEvent) => {
      event.preventDefault();
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (!text) return;
      document.execCommand(
        "insertText",
        false,
        event.currentTarget === title ? text.replace(/[\r\n]+/g, " ") : text,
      );
      schedule();
    };
    const drop = (event: DragEvent) => {
      event.preventDefault();
      const text = event.dataTransfer?.getData("text/plain") ?? "";
      if (!text) return;
      const target = event.currentTarget as HTMLElement;
      target.focus();
      const range = document.caretRangeFromPoint?.(
        event.clientX,
        event.clientY,
      );
      if (range && target.contains(range.startContainer)) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      document.execCommand(
        "insertText",
        false,
        target === title ? text.replace(/[\r\n]+/g, " ") : text,
      );
      schedule();
    };
    const dragover = (event: DragEvent) => event.preventDefault();
    const compositionStart = () => {
      composing = true;
      clearTimeout(timer);
    };
    const compositionEnd = () => {
      composing = false;
      schedule();
    };
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!blocked) void save();
      }
      if (event.target === title && event.key === "Enter")
        event.preventDefault();
    };
    const nav = (window as Window & { navigation?: EventTarget }).navigation;
    const navigate = (event: Event) => {
      if (event.cancelable && !confirmLeave()) event.preventDefault();
    };
    for (const element of [title, article]) {
      element.contentEditable = "true";
      element.setAttribute("role", "textbox");
      element.setAttribute(
        "aria-label",
        element === title ? "Post title" : "Post body",
      );
      element.setAttribute("aria-multiline", String(element === article));
      element.style.outline = "none";
      element.addEventListener("input", input);
      element.addEventListener("compositionstart", compositionStart);
      element.addEventListener("compositionend", compositionEnd);
      element.addEventListener("click", blockLinks, true);
      element.addEventListener("paste", paste);
      element.addEventListener("drop", drop);
      element.addEventListener("dragover", dragover);
    }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigation, true);
    document.addEventListener("keydown", keyboard);
    document.addEventListener("selectionchange", updateHistory);
    queueMicrotask(updateHistory);
    nav?.addEventListener("navigate", navigate);
    return () => {
      alive = false;
      clearTimeout(timer);
      retry.current = () => {};
      historyAction.current = () => {};
      for (const { element, attrs } of previous) {
        for (const [name, value] of attrs) {
          if (value === null) element.removeAttribute(name);
          else element.setAttribute(name, value);
        }
        element.removeEventListener("input", input);
        element.removeEventListener("compositionstart", compositionStart);
        element.removeEventListener("compositionend", compositionEnd);
        element.removeEventListener("click", blockLinks, true);
        element.removeEventListener("paste", paste);
        element.removeEventListener("drop", drop);
        element.removeEventListener("dragover", dragover);
      }
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigation, true);
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("selectionchange", updateHistory);
      nav?.removeEventListener("navigate", navigate);
    };
  }, [slug]);

  useEffect(() => {
    if (status !== "Saved") return;
    const timer = setTimeout(() => setStatus(""), 1000);
    return () => clearTimeout(timer);
  }, [status]);

  const saved = status === "Saved" || status === "";
  const indicatorTransition =
    "absolute inset-0 flex items-center justify-center transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none";

  const showingIndicator = !!status && !failed;
  const historyButton =
    "flex size-10 items-center justify-center opacity-70 transition-opacity duration-150 hover:opacity-100 focus-visible:outline focus-visible:outline-offset-[-4px] disabled:opacity-20 disabled:hover:opacity-20 motion-reduce:transition-none";

  return (
    <div
      ref={root}
      className="fixed bottom-5 right-5 z-50 max-w-[min(24rem,calc(100vw-3rem))] text-xs"
    >
      <span
        role="status"
        aria-live="polite"
        className={failed ? "opacity-70" : "sr-only"}
      >
        {status}
      </span>
      {history && (
        <div className="relative flex h-10 items-center justify-end">
          <div
            role="group"
            aria-label="Edit history"
            className={`flex transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${showingIndicator ? "-translate-x-8" : "translate-x-0"}`}
          >
            <button
              type="button"
              aria-label="Undo"
              title="Undo"
              disabled={!history.undo}
              className={historyButton}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => historyAction.current("undo")}
            >
              <Undo2 size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Redo"
              title="Redo"
              disabled={!history.redo}
              className={historyButton}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => historyAction.current("redo")}
            >
              <Redo2 size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute right-0 top-1/2 block size-4 -translate-y-1/2 overflow-hidden transition-opacity duration-250 ease-out motion-reduce:transition-none ${showingIndicator ? "opacity-70" : "opacity-0"}`}
          >
            <span
              className={`${indicatorTransition} ${saved ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
            >
              <Comet
                duration={1040}
                size={16}
                playState={saved || failed ? "paused" : "running"}
              />
            </span>
            <span
              className={`${indicatorTransition} ${saved ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
            >
              <Check size={16} strokeWidth={1.75} />
            </span>
          </span>
        </div>
      )}
      {failed && (
        <button
          type="button"
          className="ml-2 min-h-10 px-2 underline underline-offset-4"
          onClick={() => retry.current()}
        >
          Retry
        </button>
      )}
    </div>
  );
}
