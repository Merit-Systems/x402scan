import { NextResponse } from 'next/server';

import {
  x402ResourceServer,
  x402HTTPResourceServer,
  HTTPFacilitatorClient,
} from '@x402/core/server';

import { coinbase } from 'facilitators';

import { sendUsdcQueryParamsSchema } from './lib/schemas';

import type { NextRequest } from 'next/server';
import type {
  HTTPAdapter,
  HTTPRequestContext,
  RoutesConfig,
} from '@x402/core/server';
import type { Network } from '@x402/core/types';

function getQueryParam(url: string, name: string): string | undefined {
  try {
    return new URL(url).searchParams.get(name) ?? undefined;
  } catch {
    return undefined;
  }
}

const routes: RoutesConfig = {
  'POST /api/send': {
    accepts: [
      {
        scheme: 'exact',
        network: 'eip155:8453' as Network,
        payTo: (ctx: HTTPRequestContext) =>
          getQueryParam(ctx.adapter.getUrl(), 'address') ?? '',
        price: (ctx: HTTPRequestContext) =>
          `$${getQueryParam(ctx.adapter.getUrl(), 'amount') ?? '0'}`,
      },
      {
        scheme: 'exact',
        network: 'solana:mainnet' as Network,
        payTo: (ctx: HTTPRequestContext) =>
          getQueryParam(ctx.adapter.getUrl(), 'address') ?? '',
        price: (ctx: HTTPRequestContext) =>
          `$${getQueryParam(ctx.adapter.getUrl(), 'amount') ?? '0'}`,
      },
    ],
    description: 'Send USDC to any address on Base or Solana',
    mimeType: 'application/json',
  },
};

let httpServer: x402HTTPResourceServer | null = null;

async function getHTTPServer(): Promise<x402HTTPResourceServer> {
  if (!httpServer) {
    const facilitatorClient = new HTTPFacilitatorClient(coinbase);
    const resourceServer = new x402ResourceServer(facilitatorClient);
    httpServer = new x402HTTPResourceServer(resourceServer, routes);
    await httpServer.initialize();
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
  if (request.nextUrl.pathname !== '/api/send') {
    return NextResponse.next();
  }

  // Validate query params before payment processing
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
    return new NextResponse(
      isHtml ? (body as string) : JSON.stringify(body),
      { status, headers }
    );
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
  matcher: ['/api/send'],
};
