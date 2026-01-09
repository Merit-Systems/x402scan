import { NextResponse } from 'next/server';

import { env } from '@/env';

export const GET = () => {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  console.log(baseUrl);

  return NextResponse.json({
    issuer: baseUrl,
    authorization_endpoint: `${env.PERMI_APP_URL}/api/oauth/authorize`,
    token_endpoint: `${env.PERMI_APP_URL}/api/oauth/token`,
    registration_endpoint: `${baseUrl}/api/oauth/register`,
    response_types_supported: ['code'],
    code_challenge_methods_supported: ['S256'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['openid'],
  });
};
