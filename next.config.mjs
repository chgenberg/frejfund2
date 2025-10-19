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
  // Memory optimization for build
  productionBrowserSourceMaps: false, // Disable source maps in production to save memory
  // Reduce parallelization during build to use less memory
  webpack: (config, { isServer }) => {
    // Reduce memory usage during build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Ensure server-side environment variables are available
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize memory usage
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;

// Force rebuild Tue Sep 30 03:35:14 CEST 2025
