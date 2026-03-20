import { checkEndpointSchema, getWarningsForL3 } from '@agentcash/discovery';
import type {
  AuditWarning,
  EndpointMethodAdvisory,
} from '@agentcash/discovery';
import { PROBE_TIMEOUT_MS } from './utils';

export type ProbeX402Result =
  | {
      success: true;
      advisory: EndpointMethodAdvisory;
      warnings: AuditWarning[];
    }
  | { success: false; error: string };

/**
 * Probes a URL and returns the first advisory that carries x402 payment options.
 * Delegates entirely to checkEndpointSchema — no re-validation.
 */
export async function probeX402Endpoint(url: string): Promise<ProbeX402Result> {
  const result = await checkEndpointSchema({
    url,
    probe: true,
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });

  if (!result.found) {
    const causeMessages = {
      not_found: 'Endpoint did not return a 402 payment challenge',
      network: 'Network error reaching endpoint',
      timeout: 'Endpoint timed out',
    };
    return {
      success: false,
      error: result.message ?? causeMessages[result.cause],
    };
  }

  for (const advisory of result.advisories) {
    if (advisory.paymentOptions?.some(p => p.protocol === 'x402')) {
      return { success: true, advisory, warnings: getWarningsForL3(advisory) };
    }
  }

  return { success: false, error: 'No valid x402 response found' };
}
