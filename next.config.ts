import type { NextConfig } from "next";

// Static PoC: no server, no database. `next build` emits a plain static site
// that can be opened from disk or dropped on any static host.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
