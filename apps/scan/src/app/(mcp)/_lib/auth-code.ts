import z from 'zod';

import { jwtVerify, SignJWT } from 'jose';

import { addSeconds } from 'date-fns';

import { nanoid } from 'nanoid';

import { env } from '@/env';
import { OAuthErrorType } from './oauth-error';

const authCodeJwtInputSchema = z.object({
  user_id: z.uuid({
    error: JSON.stringify({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'user_id must be a valid UUID',
    }),
  }),
  redirect_uri: z.url({
    error: JSON.stringify({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'redirect_uri must be a valid URL',
    }),
  }),
  code_challenge: z
    .string({
      error: JSON.stringify({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'code_challenge must be a string',
      }),
    })
    .regex(/^[A-Za-z0-9_-]+$/, {
      error: JSON.stringify({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'code_challenge must be base64url encoded',
      }),
    })
    .min(43, {
      error: JSON.stringify({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'code_challenge must be at least 43 characters',
      }),
    })
    .max(128, {
      error: JSON.stringify({
        error: OAuthErrorType.INVALID_REQUEST,
        error_description: 'code_challenge must be at most 128 characters',
      }),
    }),
  code_challenge_method: z.literal('S256', {
    error: JSON.stringify({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'Only S256 code challenge method is supported',
    }),
  }),
  scope: z.string().default('openid spend'),
  nonce: z.string().optional(),
});

const authCodeJwtPayloadSchema = authCodeJwtInputSchema.extend({
  exp: z.number(),
  iat: z.number(),
  jti: z.string(),
});

export const authorizeParamsSchema = authCodeJwtInputSchema
  .omit({
    user_id: true,
  })
  .extend({
    state: z.string().optional(),
  });

const CODE_SIGNING_JWT_SECRET = new TextEncoder().encode(
  env.MCP_CODE_SIGNING_JWT_SECRET
);

export const createAuthCodeJwt = async (
  payloadInput: z.input<typeof authCodeJwtInputSchema>
) => {
  const input = authCodeJwtInputSchema.parse(payloadInput);
  const authCodeJwt = await new SignJWT(input)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(addSeconds(new Date(), env.MCP_CODE_EXPIRY_SECONDS))
    .setIssuedAt(new Date())
    .setJti(nanoid(16))
    .sign(CODE_SIGNING_JWT_SECRET);

  return authCodeJwt;
};

export const verifyAuthCodeJwt = async (jwt: string) => {
  const { payload } = await jwtVerify(jwt, CODE_SIGNING_JWT_SECRET);
  const parsedPayload = authCodeJwtPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    throw new Error('Invalid JWT');
  }
  return parsedPayload.data;
};
