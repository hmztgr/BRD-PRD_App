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
  webpack: (config, { isServer }) => {
    // Block Firebase modules at webpack level to prevent quota issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase': false,
      'firebase/app': false,
      'firebase/auth': false,
      'firebase/firestore': false,
      'firebase/analytics': false,
      '@firebase/app': false,
      '@firebase/auth': false,
      '@firebase/firestore': false,
      '@firebase/analytics': false,
    };
    
    // Block Firebase-related modules from being bundled
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'firebase': 'firebase',
        'firebase/app': 'firebase/app',
        'firebase/auth': 'firebase/auth',
        'firebase/firestore': 'firebase/firestore',
      });
    }
    
    return config;
  },
};

export default withNextIntl(nextConfig);
