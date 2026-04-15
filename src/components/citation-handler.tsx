"use client";

import { useEffect } from "react";

export function CitationHandler() {
  useEffect(() => {
    const lastClicked: Record<string, string> = {};

    function pulse(el: Element) {
      const num = el.querySelector(".cite-num");
      if (!num) return;
      num.classList.remove("cite-pulse");
      void (num as HTMLElement).offsetWidth;
      num.classList.add("cite-pulse");
    }

    function handleClick(e: MouseEvent) {
      const ref = (e.target as Element).closest(".cite-ref");
      const back = (e.target as Element).closest(".cite-back");

      if (ref) {
        e.preventDefault();
        const sourceNum = ref.getAttribute("data-source")!;
        lastClicked[sourceNum] = ref.id;
        const target = document.getElementById(`source-${sourceNum}`);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const backLink = target.querySelector(".cite-back");
        if (backLink) pulse(backLink);
      }

      if (back) {
        e.preventDefault();
        const sourceNum = back.getAttribute("data-source")!;
        const refId = lastClicked[sourceNum] || `ref-${sourceNum}-1`;
        const target = document.getElementById(refId);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        pulse(target);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
