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
    // Disable jest-worker usage in Next.js to prevent conflicts
    cpus: 1,
    // Additional experimental flags to prevent worker conflicts
    forceSwcTransforms: true,
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
      
      // Exclude Jest files from webpack processing entirely
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(/jest\.config\.js$/);
        config.externals.push(/jest\.debug\.js$/);
        config.externals.push(/test-debug\.js$/);
      }
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
