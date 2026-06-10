import type { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerEndpoint } from '@/lib/discovery/register-endpoint';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

export const CONTACT_EMAIL_WARNING =
  'Add info.contact.email to your openapi.json to verify ownership, let users contact you, and customize your merchant pages on tryponcho.com.';

export async function handleRegistryRegister(
  body: z.infer<typeof registryRegisterBodySchema>
) {
  const origin = new URL(body.url).origin;
  const [result, discoveryResult] = await Promise.all([
    registerEndpoint(body.url),
    fetchDiscoveryDocument(origin),
  ]);

  const contactEmail = discoveryResult.contactEmail;

  try {
    if (result.success && result.resource?.origin?.id) {
      revalidatePath(`/server/${result.resource.origin.id}`);
    }
  } catch (e) {
    console.error('revalidatePath failed:', e);
  }

  if (!result.success) {
    const errorBody: Record<string, unknown> = { ...result };
    if (contactEmail) {
      errorBody.contactEmail = contactEmail;
    } else {
      errorBody.warning = CONTACT_EMAIL_WARNING;
    }
    return jsonResponse(errorBody, 422);
  }

  // BigInt serialization — REST-specific (TRPC uses superjson)
  const serialized = JSON.parse(
    JSON.stringify(result, (_k, v: unknown) =>
      typeof v === 'bigint' ? Number(v) : v
    )
  ) as Record<string, unknown>;

  if (contactEmail) {
    serialized.contactEmail = contactEmail;
  } else {
    serialized.warning = CONTACT_EMAIL_WARNING;
  }

  return jsonResponse(serialized);
}
