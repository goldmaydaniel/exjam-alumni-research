/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Temporarily disable to avoid double rendering issues

  // Disable static generation for API routes that use dynamic features
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["lucide-react"], // Explicitly transpile problematic packages

  // Webpack optimizations for better performance
  webpack: (config, { dev, isServer }) => {
    // Simple optimizations that don't cause build issues
    if (!dev) {
      config.optimization.moduleIds = "deterministic";
      config.optimization.chunkIds = "deterministic";
    }

    // Optimize module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

module.exports = nextConfig;
