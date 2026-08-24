/**
 * Human-readable catalog of the public REST API (`/api/x402`). This is the
 * single source for the prose that appears in `/docs`, `/llms.txt`, and the
 * OpenAPI post-processing in `/openapi.json` (operation descriptions and path
 * parameters). Request/response *schemas* live next to the routes; this file
 * only carries the narrative that the router can't derive on its own.
 *
 * `operationId` must match what `@agentcash/router` emits: the route key with
 * `/` replaced by `_`.
 */

export type ApiAuth =
  | { kind: 'x402'; price: string }
  | { kind: 'x402-dynamic' }
  | { kind: 'siwx' };

interface ApiPathParam {
  name: string;
  description: string;
}

interface ApiEndpoint {
  operationId: string;
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  description: string;
  auth: ApiAuth;
  pathParams?: ApiPathParam[];
  example: string;
}

const ADDRESS_PARAM: ApiPathParam = {
  name: 'address',
  description:
    'Wallet address: a 0x-prefixed EVM address (Base) or a base58 Solana address.',
};

export const API_BASE_PATH = '/api/x402';

export const API_ENDPOINTS: readonly ApiEndpoint[] = [
  {
    operationId: 'x402_buyers',
    method: 'GET',
    path: '/api/x402/buyers',
    summary: 'Top buyers by volume',
    description:
      'Paginated list of the wallets that have spent the most through x402 (top senders). Supports chain and timeframe filters and sorting by volume, transaction count, or unique sellers.',
    auth: { kind: 'x402', price: '0.01' },
    example: '/api/x402/buyers?page_size=5&timeframe=7&sort_by=volume',
  },
  {
    operationId: 'x402_merchants',
    method: 'GET',
    path: '/api/x402/merchants',
    summary: 'Top merchants by volume',
    description:
      'Paginated list of the wallets that have received the most x402 payments (top recipients). Supports chain and timeframe filters and sorting by volume, transaction count, or unique buyers.',
    auth: { kind: 'x402', price: '0.01' },
    example: '/api/x402/merchants?page_size=5&chain=base',
  },
  {
    operationId: 'x402_merchants_transactions',
    method: 'GET',
    path: '/api/x402/merchants/{address}/transactions',
    summary: 'Transactions received by a merchant',
    description:
      'Paginated USDC transfer events where the given address is the recipient, newest first by default. Each row includes the sender, amount, chain, facilitator, and transaction hash.',
    auth: { kind: 'x402', price: '0.01' },
    pathParams: [ADDRESS_PARAM],
    example: '/api/x402/merchants/{address}/transactions?page_size=10',
  },
  {
    operationId: 'x402_merchants_stats',
    method: 'GET',
    path: '/api/x402/merchants/{address}/stats',
    summary: 'Aggregate stats for a merchant',
    description:
      'Total transactions, total USDC volume, unique buyers, unique sellers and the latest activity timestamp for payments received by the given address.',
    auth: { kind: 'x402', price: '0.01' },
    pathParams: [ADDRESS_PARAM],
    example: '/api/x402/merchants/{address}/stats?timeframe=30',
  },
  {
    operationId: 'x402_wallets_transactions',
    method: 'GET',
    path: '/api/x402/wallets/{address}/transactions',
    summary: 'Transactions sent by a wallet',
    description:
      'Paginated USDC transfer events where the given address is the sender (buyer), newest first by default.',
    auth: { kind: 'x402', price: '0.01' },
    pathParams: [ADDRESS_PARAM],
    example: '/api/x402/wallets/{address}/transactions?page_size=10',
  },
  {
    operationId: 'x402_wallets_stats',
    method: 'GET',
    path: '/api/x402/wallets/{address}/stats',
    summary: 'Aggregate stats for a wallet',
    description:
      'Total transactions, total USDC spent, unique recipients, and the chains a wallet has paid on.',
    auth: { kind: 'x402', price: '0.01' },
    pathParams: [ADDRESS_PARAM],
    example: '/api/x402/wallets/{address}/stats',
  },
  {
    operationId: 'x402_facilitators',
    method: 'GET',
    path: '/api/x402/facilitators',
    summary: 'Facilitators with activity stats',
    description:
      'Paginated list of x402 facilitators (the services that verify and settle payments) with their transaction counts, volume, unique buyers/sellers and supported chains.',
    auth: { kind: 'x402', price: '0.01' },
    example: '/api/x402/facilitators?timeframe=7',
  },
  {
    operationId: 'x402_facilitators_stats',
    method: 'GET',
    path: '/api/x402/facilitators/stats',
    summary: 'Ecosystem-wide facilitator stats',
    description:
      'Aggregate x402 ecosystem statistics across all facilitators: total transactions, USDC volume, unique buyers and sellers for the selected chain and timeframe.',
    auth: { kind: 'x402', price: '0.01' },
    example: '/api/x402/facilitators/stats?chain=solana&timeframe=1',
  },
  {
    operationId: 'x402_resources',
    method: 'GET',
    path: '/api/x402/resources',
    summary: 'Indexed x402 resources',
    description:
      'Paginated list of every indexed x402-protected API resource (URL, method, price, network, origin metadata and tags). Use this to find services an agent can pay for.',
    auth: { kind: 'x402', price: '0.01' },
    example: '/api/x402/resources?page_size=20&chain=base',
  },
  {
    operationId: 'x402_resources_search',
    method: 'GET',
    path: '/api/x402/resources/search',
    summary: 'Search x402 resources',
    description:
      'Full-text search across indexed resources by name, description, origin, and tags. Filter by comma-separated tag IDs or chains. The best entry point when an agent needs "an API that does X".',
    auth: { kind: 'x402', price: '0.02' },
    example: '/api/x402/resources/search?q=weather&page_size=5',
  },
  {
    operationId: 'x402_origins_resources',
    method: 'GET',
    path: '/api/x402/origins/{id}/resources',
    summary: 'Resources for an origin',
    description:
      'Paginated list of the resources registered under a single origin (server), identified by its x402scan origin ID.',
    auth: { kind: 'x402', price: '0.01' },
    pathParams: [
      {
        name: 'id',
        description:
          'x402scan origin ID (UUID), as returned by the resources endpoints.',
      },
    ],
    example: '/api/x402/origins/{id}/resources',
  },
  {
    operationId: 'x402_registry_origin',
    method: 'GET',
    path: '/api/x402/registry/origin',
    summary: 'Registered resources for an origin URL',
    description:
      'Paginated list of the resources registered for the origin of the given URL. Useful for checking what x402scan knows about your own server.',
    auth: { kind: 'x402', price: '0.01' },
    example: '/api/x402/registry/origin?url=https://example.com',
  },
  {
    operationId: 'x402_registry_register',
    method: 'POST',
    path: '/api/x402/registry/register',
    summary: 'Register one x402 resource',
    description:
      'Register a single x402-protected endpoint by URL. The origin must publish an openapi.json that lists the endpoint; x402scan probes it, records the 402 payment requirements, and adds it to the marketplace. Free; requires SIWX wallet authentication.',
    auth: { kind: 'siwx' },
    example: '/api/x402/registry/register',
  },
  {
    operationId: 'x402_registry_register-origin',
    method: 'POST',
    path: '/api/x402/registry/register-origin',
    summary: 'Register every resource on an origin',
    description:
      'Discover and register all x402 resources exposed by an origin via its OpenAPI document or /.well-known/x402. Returns per-resource registration results. Free; requires SIWX wallet authentication.',
    auth: { kind: 'siwx' },
    example: '/api/x402/registry/register-origin',
  },
  {
    operationId: 'x402_send',
    method: 'POST',
    path: '/api/x402/send',
    summary: 'Send USDC to an address',
    description:
      'Transfer USDC to a wallet on Base or Solana. The x402 payment for this request *is* the transfer: the amount you pay (up to 1000 USDC) is forwarded to the recipient address in the body.',
    auth: { kind: 'x402-dynamic' },
    example: '/api/x402/send',
  },
];

export function describeAuth(auth: ApiAuth): string {
  switch (auth.kind) {
    case 'x402':
      return `x402 · $${auth.price} USDC`;
    case 'x402-dynamic':
      return 'x402 · amount in body';
    case 'siwx':
      return 'SIWX · free';
  }
}
