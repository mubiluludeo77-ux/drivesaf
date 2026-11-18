import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root: a stray package.json in the home folder
  // otherwise makes Turbopack infer the wrong workspace root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
