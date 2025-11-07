import 'server-only';

import { generateJwt } from '@coinbase/cdp-sdk/auth';

import { env } from '@/env';
import { cdpFetchSchema } from './schema';
import z from 'zod';

const generateCdpJwtSchema = cdpFetchSchema.extend({
  expiresIn: z.number().default(120),
});

export const generateCdpJwt = async (
  input: z.input<typeof generateCdpJwtSchema>
) => {
  const { requestMethod, requestHost, requestPath, expiresIn } =
    generateCdpJwtSchema.parse(input);

  return await generateJwt({
    apiKeyId: env.CDP_API_KEY_ID,
    apiKeySecret: env.CDP_API_KEY_SECRET,
    requestMethod,
    requestHost,
    requestPath,
    expiresIn,
  });
};
