import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  // CRITICAL: Increase body size limit for file uploads
  serverExternalPackages: ['formidable'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'barn.sgp1.cdn.digitaloceanspaces.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'barn.sgp1.digitaloceanspaces.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  // Increase API body size limit for image uploads (especially on mobile)
  serverRuntimeConfig: {
    maxDuration: 60,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-dialog', '@radix-ui/react-select'],
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: '60mb', // Raised to 60MB to support 50MB+ uploads with overhead
    },
  },
  // Optimize webpack bundle
  webpack: (config, { isServer }) => {
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
};

export default nextConfig;

