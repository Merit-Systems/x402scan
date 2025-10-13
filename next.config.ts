import { createMDX } from 'fumadocs-mdx/next';

import type { NextConfig } from 'next';

const withMDX = createMDX({
  configPath: 'source.config.ts',
  outDir: '.source',
});

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
    ],
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withMDX(nextConfig);
