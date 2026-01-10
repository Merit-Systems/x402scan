import z from 'zod';

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env';
import { isValidRedirectUri } from '@/app/(mcp)/_lib/redirect-uri';

const bodySchema = z.object({
  redirect_uris: z.array(z.string()),
  token_endpoint_auth_method: z.enum([
    'none',
    'client_secret_basic',
    'client_secret_post',
  ]),
  grant_types: z.array(z.enum(['authorization_code', 'refresh_token'])),
  client_name: z.string().optional(),
  client_uri: z.string().optional(),
});

export const POST = async (request: NextRequest) => {
  const { redirect_uris, ...rest } = bodySchema.parse(await request.json());

  redirect_uris.forEach(uri => {
    if (!isValidRedirectUri(uri)) {
      throw new Error(`Invalid redirect URI: ${uri}`);
    }
  });

  return NextResponse.json({
    client_id: env.PERMI_APP_ID,
    client_id_issued_at: Date.now(),
    redirect_uris: [`${env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`],
    scope: 'openid',
    ...rest,
  });
};
