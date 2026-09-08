import { jsonResponse } from "@/app/api/x402/_lib/utils";
import { registerResourcesFromDiscovery } from "@/lib/discovery/register-origin";
import { revalidateResourceData } from "@/services/db/resources/revalidate";
import { fetchDiscoveryDocument } from "@/services/discovery";

import { contactEmailFields } from "./registry-register";

import type { z } from "zod";

import type { registryRegisterOriginBodySchema } from "@/app/api/x402/_lib/schemas";

export async function handleRegistryRegisterOrigin(
  body: z.infer<typeof registryRegisterOriginBodySchema>
) {
  const { origin } = body;
  const discoveryResult = await fetchDiscoveryDocument(origin);

  if (!discoveryResult.success) {
    return jsonResponse(
      {
        success: false,
        error: {
          type: "no_discovery",
          message: discoveryResult.error ?? "No discovery document found",
        },
      },
      404
    );
  }

  const result = await registerResourcesFromDiscovery(
    discoveryResult.resources,
    discoveryResult.source,
    discoveryResult.info,
    undefined,
    discoveryResult.contactEmail
  );

  try {
    if (result.originId) {
      revalidateResourceData(result.originId);
    }
  } catch (e) {
    console.error("Resource cache revalidation failed:", e);
  }

  if (result.registered === 0) {
    return jsonResponse(
      {
        success: false,
        error: {
          type: "no_valid_resources",
          message:
            "No valid paid x402 resources were found for this origin. Add at least one paid x402 resource that passes validation to complete registration.",
        },
        result,
      },
      422
    );
  }

  return jsonResponse({
    success: true,
    registered: result.registered,
    siwx: result.siwx,
    public: result.publicCount,
    apiKey: result.apiKeyCount,
    failed: result.failed,
    skipped: result.skipped,
    deprecated: result.deprecated,
    total: result.total,
    source: result.source,
    failedDetails:
      result.failedDetails.length > 0 ? result.failedDetails : undefined,
    siwxDetails: result.siwxDetails.length > 0 ? result.siwxDetails : undefined,
    publicDetails:
      result.publicDetails.length > 0 ? result.publicDetails : undefined,
    apiKeyDetails:
      result.apiKeyDetails.length > 0 ? result.apiKeyDetails : undefined,
    ...contactEmailFields(discoveryResult.contactEmail),
  });
}
