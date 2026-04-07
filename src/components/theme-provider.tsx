"use client";

import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      document.documentElement.setAttribute(
        "data-theme",
        mq.matches ? "dark" : "light"
      );
    };

    apply();
    mq.addEventListener("change", apply);
    setMounted(true);

    return () => mq.removeEventListener("change", apply);
  }, []);

  if (!mounted) return <div style={{ visibility: "hidden" }}>{children}</div>;

  return <>{children}</>;
}
