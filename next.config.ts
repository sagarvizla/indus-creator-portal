import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  eslint: {
    // Ignore *all* ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  // …any other settings you already have…
};

export default nextConfig;
