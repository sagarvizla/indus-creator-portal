import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js to ignore all ESLint errors during the production build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ...any other settings you need can go here...
};

export default nextConfig;
