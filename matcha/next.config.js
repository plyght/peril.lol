/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/matcha', // Base path for your subdirectory
  assetPrefix: '/matcha/', // Prefix for static assets
  images: {
    unoptimized: true, // Disable image optimization for GitHub Pages
  },
};

module.exports = nextConfig;
