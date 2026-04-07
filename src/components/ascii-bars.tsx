"use client";

import { useEffect, useState } from "react";

const patterns = ["▁▂▃", "▂▃▁", "▃▁▂", "▂▁▃", "▂▇▃", "▃▇▁", "▇▁▂", "▂▁▇", "▁▇▂", "▃▂▇"];

export function AsciiBars() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % patterns.length);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return <span className="ascii-bars">{patterns[idx]}</span>;
}
