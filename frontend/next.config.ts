import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,

  turbopack: {
    root: process.cwd(),
  },
} satisfies NextConfig;

export default nextConfig;