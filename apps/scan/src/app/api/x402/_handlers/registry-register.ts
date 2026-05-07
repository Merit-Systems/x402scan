import { Result, matchError } from 'better-result';

import type { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerResource } from '@/lib/resources';

import { probeX402Endpoint } from '@/lib/discovery/probe';
import type { ProbeError, RegisterError } from '@/lib/discovery/errors';
import type { z } from 'zod';

function probeStatus(error: ProbeError): number {
  return matchError(error, {
    LocalUrlNotSupported: () => 400,
    InvalidUrl: () => 400,
    ProbeNetworkError: () => 502,
    ProbeTimeout: () => 504,
    No402Challenge: () => 422,
    ProbeUnexpectedError: () => 502,
  });
}

function registerStatus(error: RegisterError): number {
  return matchError(error, {
    NoPaymentOptions: () => 422,
    MissingInputSchema: () => 422,
    UnsupportedNetwork: () => 422,
    ResourceUpsertFailed: () => 500,
  });
}

export async function handleRegistryRegister(
  body: z.infer<typeof registryRegisterBodySchema>
) {
  const { url } = body;

  const probeResult = await probeX402Endpoint(
    url.replaceAll('{', '').replaceAll('}', '')
  );

  if (Result.isError(probeResult)) {
    return jsonResponse(
      {
        success: false,
        error: probeResult.error,
      },
      probeStatus(probeResult.error)
    );
  }

  const result = await registerResource(url, probeResult.value.advisory);

  if (Result.isError(result)) {
    return jsonResponse(
      {
        success: false,
        error: result.error,
      },
      registerStatus(result.error)
    );
  }

  return jsonResponse(
    JSON.parse(
      JSON.stringify(
        {
          success: true,
          resource: result.value.resource,
          accepts: result.value.accepts,
          registrationDetails: result.value.registrationDetails,
        },
        (_k, v: unknown) => (typeof v === 'bigint' ? Number(v) : v)
      )
    )
  );
}
