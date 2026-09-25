import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "development" ? undefined : "export",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["192.168.1.197"],
};

export default nextConfig;
