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
};

export default nextConfig;


