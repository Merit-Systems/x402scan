import z from 'zod';

import { SignJWT, jwtVerify } from 'jose';

import { nanoid } from 'nanoid';

import { addSeconds, isAfter } from 'date-fns';
import { env } from '@/env';

const accessTokenInputSchema = z.object({
  user_id: z.uuid(),
  scope: z.string(),
  key_version: z.number().default(1),
});

const accessTokenPayloadSchema = accessTokenInputSchema.extend({
  exp: z.number(),
  iat: z.number(),
  jti: z.string(),
});

const MCP_ACCESS_TOKEN_SIGNING_JWT_SECRET = new TextEncoder().encode(
  env.MCP_ACCESS_TOKEN_SIGNING_JWT_SECRET
);

export const createAccessToken = async (
  params: z.input<typeof accessTokenInputSchema>
) => {
  const { user_id, scope, key_version } = accessTokenInputSchema.parse(params);

  const expiresAt = addSeconds(new Date(), env.MCP_ACCESS_TOKEN_EXPIRY_SECONDS);

  const token = await new SignJWT({
    user_id,
    scope,
    key_version,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user_id)
    .setAudience('cursor')
    .setJti(nanoid(16))
    .setIssuedAt(new Date())
    .setExpirationTime(expiresAt)
    .sign(MCP_ACCESS_TOKEN_SIGNING_JWT_SECRET);

  return {
    token,
    expiresAt,
    scope,
  };
};

export const verifyAccessToken = async (jwt: string) => {
  const { payload } = await jwtVerify(
    jwt,
    MCP_ACCESS_TOKEN_SIGNING_JWT_SECRET,
    {
      clockTolerance: 5, // 5 seconds clock skew tolerance
    }
  );

  // Type assertion with validation
  const parsedPayload = accessTokenPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    throw new Error('Invalid JWT');
  }

  if (isAfter(new Date(), new Date(parsedPayload.data.exp * 1000))) {
    throw new Error('JWT has expired');
  }

  return parsedPayload.data;
};
