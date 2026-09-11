import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every SVG served here is a first-party export from /assets.
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
