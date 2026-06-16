import type { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerEndpoint } from '@/lib/discovery/register-endpoint';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

const CONTACT_EMAIL_WARNING =
  'Add info.contact.email to your openapi.json to verify ownership, let users contact you, and customize your merchant pages on tryponcho.com.';

export function contactEmailFields(contactEmail: string | undefined) {
  return contactEmail ? { contactEmail } : { warning: CONTACT_EMAIL_WARNING };
}

export async function handleRegistryRegister(
  body: z.infer<typeof registryRegisterBodySchema>
) {
  const origin = new URL(body.url).origin;

  // Discovery document (openapi.json) is required before we probe the endpoint.
  const discoveryResult = await fetchDiscoveryDocument(origin);

  if (!discoveryResult.success) {
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'no_discovery',
          message:
            discoveryResult.error ??
            'No discovery document found. Add an openapi.json to your origin to register endpoints.',
        },
      },
      404
    );
  }

  const contactEmail = discoveryResult.contactEmail;

  const result = await registerEndpoint(body.url);

  try {
    if (result.success && result.resource?.origin?.id) {
      revalidatePath(`/server/${result.resource.origin.id}`);
    }
  } catch (e) {
    console.error('revalidatePath failed:', e);
  }

  if (!result.success) {
    return jsonResponse(
      { ...result, ...contactEmailFields(contactEmail) },
      422
    );
  }

  // BigInt serialization — REST-specific (TRPC uses superjson)
  const serialized = JSON.parse(
    JSON.stringify(result, (_k, v: unknown) =>
      typeof v === 'bigint' ? Number(v) : v
    )
  ) as Record<string, unknown>;

  return jsonResponse({ ...serialized, ...contactEmailFields(contactEmail) });
}
