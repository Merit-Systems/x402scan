import { NextRequest, NextResponse } from 'next/server';
import { registerResourcesFromDiscovery } from '@/lib/discovery/register-origin';

/**
 * POST /api/resources/register
 * Register resources from an origin URL programmatically.
 * Body: { origin: string, chain?: string, address?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, chain, address } = body;

    if (!origin || typeof origin !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: origin' },
        { status: 400 }
      );
    }

    const result = await registerResourcesFromDiscovery(origin, {
      chain,
      address,
    });

    if (result.registered === 0) {
      return NextResponse.json(
        { message: 'No new resources found', origin },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: `Registered ${result.registered} resource(s)`,
      origin,
      registered: result.registered,
      resources: result.resources,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
