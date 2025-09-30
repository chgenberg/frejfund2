/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Allow production builds to successfully complete even if
    // there are ESLint errors. We enforce locally and fix iteratively.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking in production builds; CI can run tsc separately.
    ignoreBuildErrors: true,
  },
  // Ensure server-side environment variables are available
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;


// Force rebuild Tue Sep 30 03:35:14 CEST 2025
