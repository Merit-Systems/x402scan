import createMDX from '@next/mdx';

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
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
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

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

export default withMDX(nextConfig);
