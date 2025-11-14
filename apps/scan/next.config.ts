import type { NextConfig } from 'next';

// @ts-expect-error - No type declarations available for this package
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const nextConfig: NextConfig = {
  typedRoutes: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.x402.org',
      },
      {
        protocol: 'https',
        hostname: 'vbdmyxikqhgfmwge.public.blob.vercel-storage.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return config;
  },
  skipTrailingSlashRedirect: true,
  experimental: {
    turbopackScopeHoisting: false,
    authInterrupts: true,
  },
  serverExternalPackages: ['@lmnr-ai/lmnr'],
  devIndicators: false,
};

export default nextConfig;
