'use client';

import { useState } from 'react';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import { motion } from 'framer-motion';

export function ProgressiveBlurHover() {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className="relative my-4 aspect-square h-[300px] overflow-hidden rounded-[4px]"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <img
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"
        alt="Abstract dark artwork"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <ProgressiveBlur
        className="pointer-events-none absolute bottom-0 left-0 h-[75%] w-full"
        blurIntensity={0.5}
        animate={isHover ? 'visible' : 'hidden'}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0"
        animate={isHover ? 'visible' : 'hidden'}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-start gap-0 px-5 py-4">
          <p className="text-base font-medium text-white">Cosmic Canvas</p>
          <span className="text-base text-zinc-300">Abstract Dreams</span>
        </div>
      </motion.div>
    </div>
  );
}
