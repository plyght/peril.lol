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
  
  // Caching is now configured differently in production builds
  
  // View transitions are now stable in Astro
});