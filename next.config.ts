import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // bodySizeLimit controls how much data a server action can receive.
    // proxyClientMaxBodySize controls the internal Next.js proxy layer (added
    // in 15.5+) — it defaults to ~1MB and silently drops data beyond that,
    // causing "Unexpected end of form" for video uploads even when bodySizeLimit
    // is high. Both must be set to the same value.
    serverActions: {
      bodySizeLimit: "60mb",
    },
    proxyClientMaxBodySize: "60mb",
  },
};

export default nextConfig;
