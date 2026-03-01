import createMDX from '@next/mdx';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async rewrites() {
    return Promise.resolve([
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/deposit/:path*',
        destination: '/mcp/deposit/:path*',
      },
      {
        source: '/discovery',
        destination: '/discover',
      },
    ]);
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
  skipTrailingSlashRedirect: true,
  experimental: {
    turbopackScopeHoisting: false,
    authInterrupts: true,
  },
  serverExternalPackages: ['@lmnr-ai/lmnr'],
  devIndicators: false,
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

export default withMDX(nextConfig);
