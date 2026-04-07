"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import React, { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
  href?: string;
}

export function HoverCard({ children, content, href }: HoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const springConfig = { stiffness: 120, damping: 18 };
  const x = useMotionValue(0);
  const translateX = useSpring(x, springConfig);

  const handleMouseMove = (event: React.MouseEvent) => {
    const target = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - target.left;
    const offsetFromCenter = (offsetX - target.width / 2) / 2;
    x.set(offsetFromCenter);
  };

  return (
    <HoverCardPrimitive.Root
      openDelay={50}
      closeDelay={120}
      onOpenChange={setIsOpen}
    >
      <HoverCardPrimitive.Trigger
        asChild
        onMouseMove={handleMouseMove}
      >
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="interactive-word"
          >
            {children}
          </a>
        ) : (
          <span className="interactive-word">{children}</span>
        )}
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          className="z-50"
          side="top"
          align="center"
          sideOffset={8}
          style={{ transformOrigin: "var(--radix-hover-card-content-transform-origin)" }}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                }}
                style={{ x: translateX }}
                className="hover-card-content"
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
