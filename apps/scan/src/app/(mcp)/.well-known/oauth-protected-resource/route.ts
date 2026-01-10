import { env } from '@/env';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  return Promise.resolve(
    NextResponse.json({
      resource: env.NEXT_PUBLIC_APP_URL,
      authorization_servers: [env.NEXT_PUBLIC_APP_URL],
      scopes_supported: ['openid', 'email'],
      resource_name: 'x402scan MCP',
    })
  );
};
