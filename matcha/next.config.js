/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Export static files
  basePath: '/matcha', // Set the base path to "/matcha"
  assetPrefix: '/matcha/', // Prefix assets with the subpath
  images: {
    unoptimized: true, // Disable Next.js image optimization for static hosting
  },
};

module.exports = nextConfig;
