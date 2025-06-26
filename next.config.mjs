/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js to ignore all ESLint errors during the production build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ...any other settings you need can go here...
};

export default nextConfig;
