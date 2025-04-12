'use client';

import { useState } from 'react';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import { motion } from 'framer-motion';

export function BannerBlur() {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <ProgressiveBlur
        className="pointer-events-none absolute inset-0"
        direction="bottom"
        blurLayers={12}
        blurIntensity={isHover ? 1.2 : 0.3}
        animate={{
          opacity: isHover ? 1 : 0.7,
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      <motion.div
        className="absolute bottom-0 left-0 w-full p-4"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHover ? 1 : 0,
          y: isHover ? 0 : 10,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-start gap-2">
          <motion.p
            className="text-xl font-bold text-white drop-shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHover ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            plyght
          </motion.p>
          <motion.p
            className="text-sm text-white/90 drop-shadow-sm max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHover ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Student & Full Stack Developer
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
