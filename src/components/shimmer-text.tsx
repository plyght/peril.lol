"use client";

import { motion } from "framer-motion";

export function ShimmerText({
  children,
  className,
  style,
  duration = 2,
  delay = 2,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.span
      className={className}
      style={{
        display: "inline-block",
        WebkitTextFillColor: "transparent",
        background:
          "currentColor linear-gradient(to right, currentColor 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.6) 60%, currentColor 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        backgroundRepeat: "no-repeat",
        backgroundSize: "50% 200%",
        ...style,
      } as React.CSSProperties}
      initial={{ backgroundPositionX: "250%" }}
      animate={{ backgroundPositionX: ["-100%", "250%"] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}
