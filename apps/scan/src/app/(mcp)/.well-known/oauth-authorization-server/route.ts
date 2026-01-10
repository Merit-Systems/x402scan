import { NextResponse } from 'next/server';

import { env } from '@/env';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  console.log('baseUrl', baseUrl);

  return Promise.resolve(
    NextResponse.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/api/oauth/token`,
      registration_endpoint: `${baseUrl}/api/oauth/register`,
      response_types_supported: ['code'],
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ['spend'],
    })
  );
};
