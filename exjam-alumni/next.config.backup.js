/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Webpack configuration to fix module resolution issues
  webpack: (config, { dev, isServer }) => {
    // Fix for webpack module resolution issues in Next.js 15.5.0
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Optimize webpack for better module resolution
    if (dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: "all",
            name: "framework",
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /node_modules/,
            name: "lib",
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "yzrzjagkkycmdwuhrvww.supabase.co",
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable experimental features that might cause issues
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
  },
};

module.exports = nextConfig;
