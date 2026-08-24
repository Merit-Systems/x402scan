import { env } from '@/env';

/**
 * Canonical site identity shared by every agent-facing surface (llms.txt,
 * JSON-LD, OpenAPI post-processing, markdown variants, trust pages). Keep it
 * in one place so the name, description, and contact details never drift
 * between representations.
 */
export const SITE_URL = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

export const SITE_NAME = 'x402scan';

export const SITE_DESCRIPTION =
  'Explore the x402 ecosystem. View transactions, sellers, origins and resources. Explore the future of agentic commerce.';

export const REPO_URL = 'https://github.com/Merit-Systems/x402scan';
export const NPM_MCP_URL = 'https://www.npmjs.com/package/@x402scan/mcp';
export const X_URL = 'https://x.com/x402scan';

export const ORG = {
  name: 'Merit Systems',
  legalName: 'Merit Systems, Inc.',
  url: 'https://merit.systems',
  email: 'legal@merit.systems',
  privacyEmail: 'privacy@merit.systems',
  address: {
    streetAddress: '224 West 35th Street, Ste 500 #2218',
    addressLocality: 'New York',
    addressRegion: 'NY',
    postalCode: '10001',
    addressCountry: 'US',
  },
} as const;

/** Public REST API versioning contract. Documented in /docs and OpenAPI. */
export const API_VERSION = '1';
export const API_VERSION_HEADER = 'X-API-Version';
