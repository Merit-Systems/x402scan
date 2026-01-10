import z from 'zod';

import { NextResponse } from 'next/server';

import { createHash } from 'crypto';

import { differenceInSeconds } from 'date-fns';

import { oauthRoute } from '@/app/(mcp)/_lib/oauth-route';
import { OAuthError, OAuthErrorType } from '@/app/(mcp)/_lib/oauth-error';
import { verifyAuthCodeJwt } from '@/app/(mcp)/_lib/auth-code';
import { isValidRedirectUri } from '@/app/(mcp)/_lib/redirect-uri';
import { createAccessToken } from '@/app/(mcp)/_lib/access-token';

import { getUserWithAccounts } from '@/services/db/user/user';

export const bodySchema = z.object({
  grant_type: z.literal('authorization_code', {
    error: JSON.stringify({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'grant_type must be authorization_code',
    }),
  }),
  redirect_uri: z.string({
    error: JSON.stringify({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'redirect_uri must be a valid URL',
    }),
  }),
  code: z.string({
    error: JSON.stringify({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'code must be a string',
    }),
  }),
  code_verifier: z
    .string({
      error: JSON.stringify({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'code_verifier must be a string',
      }),
    })
    .min(43, {
      error: JSON.stringify({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'code_verifier must be at least 43 characters',
      }),
    })
    .max(128, {
      error: JSON.stringify({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'code_verifier must be at most 128 characters',
      }),
    })
    .regex(/^[A-Za-z0-9._~-]+$/, {
      error: JSON.stringify({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'code_verifier contains invalid characters',
      }),
    }),
});

export const POST = oauthRoute
  .body(bodySchema)
  .handler(async (req, { body }) => {
    const { code, redirect_uri, code_verifier } = body;

    const {
      redirect_uri: codeRedirectUri,
      code_challenge,
      user_id,
      scope,
    } = await verifyAuthCodeJwt(code);

    if (codeRedirectUri !== redirect_uri) {
      throw new OAuthError({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'Redirect URI does not match the authorization code',
      });
    }

    const codeVerifierHash = createHash('sha256')
      .update(code_verifier)
      .digest('base64url');

    if (codeVerifierHash !== code_challenge) {
      throw new OAuthError({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'PKCE verification failed',
      });
    }

    const user = await getUserWithAccounts(user_id);

    if (!user) {
      throw new OAuthError({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'User not found',
      });
    }

    if (!isValidRedirectUri(redirect_uri)) {
      throw new OAuthError({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: `Redirect URI is not authorized for this app: ${redirect_uri}`,
      });
    }

    const accessToken = await createAccessToken({
      user_id: user.id,
      scope,
    });

    return NextResponse.json({
      token_type: 'Bearer',
      access_token: accessToken.token,
      expires_in: differenceInSeconds(accessToken.expiresAt, new Date()),
      scope: 'spend',
    });
  });
