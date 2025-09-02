import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['next-intl'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Disable worker threads that might cause jest-worker issues
    workerThreads: false,
  },
  // Exclude Jest and test files from Next.js processing
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Ignore Jest files during development
      const existingIgnored = config.watchOptions?.ignored || [];
      const jestFiles = [
        '**/jest.config.js',
        '**/jest.setup.js', 
        '**/jest.debug.js',
        '**/test-debug.js',
        '**/__tests__/**',
        '**/*.test.{js,ts,tsx}',
        '**/*.spec.{js,ts,tsx}',
        '**/jest-debug.log'
      ];
      
      config.watchOptions = {
        ...config.watchOptions,
        ignored: Array.isArray(existingIgnored) 
          ? [...existingIgnored, ...jestFiles]
          : jestFiles
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
