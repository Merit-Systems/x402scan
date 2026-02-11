import { NextResponse } from 'next/server';

import {
  x402ResourceServer,
  x402HTTPResourceServer,
  HTTPFacilitatorClient,
} from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import { registerExactSvmScheme } from '@x402/svm/exact/server';
import { bazaarResourceServerExtension } from '@x402/extensions/bazaar';

import { coinbase } from 'facilitators';

import { env } from './env';
import { sendUsdcQueryParamsSchema } from './lib/schemas';
import {
  walletTransactionsExtension,
  walletStatsExtension,
  merchantsListExtension,
  merchantTransactionsExtension,
  merchantStatsExtension,
  facilitatorsListExtension,
  facilitatorStatsExtension,
  resourcesListExtension,
  resourcesSearchExtension,
  originResourcesExtension,
} from './app/api/data/_lib/extensions';

import type { NextRequest } from 'next/server';
import type {
  HTTPAdapter,
  HTTPRequestContext,
  RoutesConfig,
} from '@x402/core/server';
import type { Network } from '@x402/core/types';

const BASE_MAINNET: Network = 'eip155:8453' as Network;
const SOLANA_MAINNET: Network =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as Network;

function getQueryParam(url: string, name: string): string | undefined {
  try {
    return new URL(url).searchParams.get(name) ?? undefined;
  } catch {
    return undefined;
  }
}

const dataRouteConfig = (
  description: string,
  price: string,
  extensions: Record<string, unknown>
) => {
  if (!env.X402_PAYEE_ADDRESS) {
    throw new Error('X402_PAYEE_ADDRESS environment variable is required');
  }
  return {
    accepts: [
      {
        scheme: 'exact' as const,
        network: BASE_MAINNET,
        payTo: env.X402_PAYEE_ADDRESS,
        price,
      },
    ],
    description,
    mimeType: 'application/json',
    extensions,
  };
};

const routes: RoutesConfig = {
  'POST /api/send': {
    accepts: [
      {
        scheme: 'exact',
        network: BASE_MAINNET,
        payTo: (ctx: HTTPRequestContext) =>
          getQueryParam(ctx.adapter.getUrl(), 'address') ?? '',
        price: (ctx: HTTPRequestContext) =>
          `$${getQueryParam(ctx.adapter.getUrl(), 'amount') ?? '0'}`,
      },
      {
        scheme: 'exact',
        network: SOLANA_MAINNET,
        payTo: (ctx: HTTPRequestContext) =>
          getQueryParam(ctx.adapter.getUrl(), 'address') ?? '',
        price: (ctx: HTTPRequestContext) =>
          `$${getQueryParam(ctx.adapter.getUrl(), 'amount') ?? '0'}`,
      },
    ],
    description: 'Send USDC to any address on Base or Solana',
    mimeType: 'application/json',
  },

  // ── Wallet endpoints ───────────────────────────────
  'GET /api/data/wallets/[address]/transactions': dataRouteConfig(
    'Paginated transfers where wallet is sender',
    '$0.01',
    walletTransactionsExtension
  ),
  'GET /api/data/wallets/[address]/stats': dataRouteConfig(
    'Aggregate stats for a wallet (tx count, total amount, unique recipients)',
    '$0.01',
    walletStatsExtension
  ),

  // ── Merchant endpoints ─────────────────────────────
  'GET /api/data/merchants': dataRouteConfig(
    'Paginated list of merchants (top recipients by volume)',
    '$0.01',
    merchantsListExtension
  ),
  'GET /api/data/merchants/[address]/transactions': dataRouteConfig(
    'Paginated transfers where merchant is recipient',
    '$0.01',
    merchantTransactionsExtension
  ),
  'GET /api/data/merchants/[address]/stats': dataRouteConfig(
    'Aggregate stats for a merchant',
    '$0.01',
    merchantStatsExtension
  ),

  // ── Facilitator endpoints ──────────────────────────
  'GET /api/data/facilitators': dataRouteConfig(
    'Paginated list of facilitators with stats',
    '$0.01',
    facilitatorsListExtension
  ),
  'GET /api/data/facilitators/stats': dataRouteConfig(
    'Overall high-level facilitator stats',
    '$0.01',
    facilitatorStatsExtension
  ),

  // ── Resource endpoints ─────────────────────────────
  'GET /api/data/resources': dataRouteConfig(
    'Paginated list of all indexed x402 resources',
    '$0.01',
    resourcesListExtension
  ),
  'GET /api/data/resources/search': dataRouteConfig(
    'Full-text search across x402 resources',
    '$0.02',
    resourcesSearchExtension
  ),

  // ── Origin endpoints ───────────────────────────────
  'GET /api/data/origins/[id]/resources': dataRouteConfig(
    'Resources for a specific origin/domain',
    '$0.01',
    originResourcesExtension
  ),
};

let httpServer: x402HTTPResourceServer | null = null;

async function getHTTPServer(): Promise<x402HTTPResourceServer> {
  if (!httpServer) {
    const facilitatorClient = new HTTPFacilitatorClient(coinbase);
    const resourceServer = new x402ResourceServer(facilitatorClient);
    resourceServer.registerExtension(bazaarResourceServerExtension);
    registerExactEvmScheme(resourceServer);
    registerExactSvmScheme(resourceServer);
    const server = new x402HTTPResourceServer(resourceServer, routes);
    await server.initialize();
    httpServer = server;
  }
  return httpServer;
}

function createAdapter(request: NextRequest): HTTPAdapter {
  return {
    getHeader: (name: string) => request.headers.get(name) ?? undefined,
    getMethod: () => request.method,
    getPath: () => request.nextUrl.pathname,
    getUrl: () => request.url,
    getAcceptHeader: () => request.headers.get('accept') ?? '',
    getUserAgent: () => request.headers.get('user-agent') ?? '',
    getQueryParams: () => Object.fromEntries(request.nextUrl.searchParams),
    getQueryParam: (name: string) =>
      request.nextUrl.searchParams.get(name) ?? undefined,
  };
}

export async function proxy(request: NextRequest) {
  // Validate /api/send query params before payment processing
  if (request.nextUrl.pathname === '/api/send') {
    const paramResult = sendUsdcQueryParamsSchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    if (!paramResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid query parameters',
          details: paramResult.error.issues,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const server = await getHTTPServer();
  const adapter = createAdapter(request);
  const context: HTTPRequestContext = {
    adapter,
    path: request.nextUrl.pathname,
    method: request.method,
  };

  const result = await server.processHTTPRequest(context);

  if (result.type === 'no-payment-required') {
    return NextResponse.next();
  }

  if (result.type === 'payment-error') {
    const { status, headers, body, isHtml } = result.response;
    return new NextResponse(isHtml ? (body as string) : JSON.stringify(body), {
      status,
      headers,
    });
  }

  if (result.type === 'payment-verified') {
    const settlement = await server.processSettlement(
      result.paymentPayload,
      result.paymentRequirements,
      result.declaredExtensions
    );

    if (!settlement.success) {
      return new NextResponse(
        JSON.stringify({
          error: settlement.errorReason ?? 'Settlement failed',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = NextResponse.next();
    for (const [key, value] of Object.entries(settlement.headers)) {
      response.headers.set(key, value);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/send', '/api/data/:path*'],
};
