'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SimpleBannerBlur() {
  const [isHover, setIsHover] = useState(false);
  
  return (
    <div 
      className="absolute inset-0 w-full h-full z-10"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Semi-transparent gradient overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent",
          "transition-all duration-500 ease-in-out"
        )}
        style={{
          opacity: isHover ? 0.8 : 0.4,
          backdropFilter: `blur(${isHover ? '2px' : '0px'})`,
          WebkitBackdropFilter: `blur(${isHover ? '2px' : '0px'})`,
        }}
      />
      
      {/* Text content that appears on hover */}
      <motion.div
        className="absolute bottom-0 left-0 w-full p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isHover ? 1 : 0,
          y: isHover ? 0 : 20
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-start gap-3">
          <motion.p 
            className="text-2xl font-bold text-white drop-shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHover ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            plyght
          </motion.p>
          <motion.p 
            className="text-base text-white/90 drop-shadow-md max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHover ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Student & Full Stack Developer
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}