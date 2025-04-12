// @ts-check
import { defineConfig } from 'astro/config';

// @ts-check
import { rehypeFigure } from "./rehype-figure.mjs";

// @ts-check
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.peril.lol',

  markdown: {
      shikiConfig: {
          theme: 'catppuccin-mocha',
      },
      rehypePlugins: [[rehypeFigure, { className: 'image-figure' }]]
  },

  integrations: [react()],
  
  // Optimize performance
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
    assetsPrefix: '/_astro'
  },
  
  // Add caching headers
  server: {
    headers: {
      '/*.{js,css,jpg,jpeg,png,gif,svg,webp,woff,woff2}': [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    }
  },
  
  // Enable view transitions for smooth page navigation
  experimental: {
    viewTransitions: true
  },
});