import type { NextConfig } from 'next';

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
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  experimental: {
    turbopackScopeHoisting: false,
    authInterrupts: true,
  },
  serverExternalPackages: ['@lmnr-ai/lmnr'],
  devIndicators: false,
};

export default nextConfig;
