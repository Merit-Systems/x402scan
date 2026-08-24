import { withPostHogConfig } from '@posthog/nextjs-config';

import type { NextConfig } from 'next';

// RFC 8288 Link header advertising agent-discovery resources. Points agents at
// the API catalog (RFC 9727) and the machine-readable OpenAPI spec so they can
// bootstrap from any page. See https://www.rfc-editor.org/rfc/rfc8288
const agentDiscoveryLinkHeader = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
].join(', ');

const nextConfig: NextConfig = {
  typedRoutes: true,
  async headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: [{ key: 'Link', value: agentDiscoveryLinkHeader }],
      },
    ]);
  },
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
        source: '/discovery/spec',
        destination: '/integration-spec',
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

export default withPostHogConfig(nextConfig, {
  personalApiKey: process.env.POSTHOG_API_KEY!,
  projectId: process.env.POSTHOG_PROJECT_ID!,
  // API host for source-map upload — NOT NEXT_PUBLIC_POSTHOG_HOST, which is
  // the ingestion host (us.i.posthog.com) used by the runtime SDK.
  host: 'https://us.posthog.com',
  sourcemaps: {
    // Uploading ~7k source maps takes minutes, and POSTHOG_PROJECT_ID /
    // POSTHOG_API_KEY are only set in the Production environment — preview
    // builds fail at config load without this guard.
    enabled:
      process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production',
  },
});
