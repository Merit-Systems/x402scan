import type { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerEndpoint } from '@/lib/discovery/register-endpoint';
import type { z } from 'zod';

export async function handleRegistryRegister(
  body: z.infer<typeof registryRegisterBodySchema>
) {
  const result = await registerEndpoint(body.url);

  if (!result.success) {
    return jsonResponse(result, 422);
  }

  // BigInt serialization — REST-specific (TRPC uses superjson)
  return jsonResponse(
    JSON.parse(
      JSON.stringify(result, (_k, v: unknown) =>
        typeof v === 'bigint' ? Number(v) : v
      )
    )
  );
}
