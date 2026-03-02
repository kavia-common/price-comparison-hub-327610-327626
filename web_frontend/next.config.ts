import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Use default Next.js output mode.
   *
   * Static export mode can fail in some environments with:
   * "Cannot find module for page: /_document"
   * This project uses the App Router (src/app) and is intended to run as a normal Next.js app.
   */
};

export default nextConfig;
