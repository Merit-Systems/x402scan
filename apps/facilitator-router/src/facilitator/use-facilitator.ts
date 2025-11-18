import { toJsonSafe } from './to-json-safe';
import type {
  ListDiscoveryResourcesRequest,
  ListDiscoveryResourcesResponse,
  FacilitatorConfig,
  SupportedPaymentKindsResponse,
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from 'x402/types';
import { FacilitatorError, JsonParsingError } from '../errors';
import { ResultAsync, Result } from 'neverthrow';

function parseJsonSafely(text: string): Result<unknown, JsonParsingError> {
  return Result.fromThrowable(
    () => JSON.parse(text) as Record<string, unknown>,
    () => new JsonParsingError('Failed to parse error response', text)
  )();
}

function ensureObject(json: unknown): Record<string, unknown> {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return { _value: json };
}

async function extractErrorMessage(
  res: Response
): Promise<Record<string, unknown>> {
  const clonedRes = res.clone();

  const result = await ResultAsync.fromPromise(
    clonedRes.text(),
    () => new JsonParsingError('Failed to read error response')
  ).andThen(text => {
    return parseJsonSafely(text).map(ensureObject);
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value;
}

async function createFacilitatorError(
  res: Response,
  facilitatorName: string
): Promise<FacilitatorError> {
  const errorMessageJson = await extractErrorMessage(res);

  // Extract response headers
  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return new FacilitatorError(
    `Failed to ${res.url}: ${res.status} ${JSON.stringify(errorMessageJson)}`,
    facilitatorName,
    res.status,
    errorMessageJson,
    responseHeaders
  );
}

/**
 * Creates a facilitator client for interacting with the X402 payment facilitator service
 *
 * @param facilitator - The facilitator config to use. If not provided, the default facilitator will be used.
 * @param facilitatorName - The name of the facilitator for error reporting
 * @returns An object containing verify and settle functions for interacting with the facilitator
 */
export function useFacilitator(
  facilitator: FacilitatorConfig,
  facilitatorName: string
) {
  /**
   * Verifies a payment payload with the facilitator service
   *
   * @param payload - The payment payload to verify
   * @param paymentRequirements - The payment requirements to verify against
   * @returns A promise that resolves to the verification response
   */
  async function verify(
    payload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<VerifyResponse> {
    const url = facilitator.url;

    let headers = { 'Content-Type': 'application/json' };
    if (facilitator?.createAuthHeaders) {
      const authHeaders = await facilitator.createAuthHeaders();
      headers = { ...headers, ...authHeaders.verify };
    }

    const res = await fetch(`${url}/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        x402Version: payload.x402Version,
        paymentPayload: toJsonSafe(payload),
        paymentRequirements: toJsonSafe(paymentRequirements),
      }),
    });

    if (res.status !== 200) {
      throw await createFacilitatorError(res, facilitatorName);
    }

    const data = (await res.json()) as VerifyResponse;
    return data;
  }

  /**
   * Settles a payment with the facilitator service
   *
   * @param payload - The payment payload to settle
   * @param paymentRequirements - The payment requirements for the settlement
   * @returns A promise that resolves to the settlement response
   */
  async function settle(
    payload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<SettleResponse> {
    const url = facilitator.url;

    let headers = { 'Content-Type': 'application/json' };
    if (facilitator?.createAuthHeaders) {
      const authHeaders = await facilitator.createAuthHeaders();
      headers = { ...headers, ...authHeaders.settle };
    }

    const res = await fetch(`${url}/settle`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        x402Version: payload.x402Version,
        paymentPayload: toJsonSafe(payload),
        paymentRequirements: toJsonSafe(paymentRequirements),
      }),
    });

    if (res.status !== 200) {
      throw await createFacilitatorError(res, facilitatorName);
    }

    const data = (await res.json()) as SettleResponse;
    return data;
  }

  /**
   * Gets the supported payment kinds from the facilitator service.
   *
   * @returns A promise that resolves to the supported payment kinds
   */
  async function supported(): Promise<SupportedPaymentKindsResponse> {
    const url = facilitator.url;

    let headers = { 'Content-Type': 'application/json' };
    if (facilitator?.createAuthHeaders) {
      const authHeaders = await facilitator.createAuthHeaders();
      headers = { ...headers, ...authHeaders.supported };
    }

    const res = await fetch(`${url}/supported`, {
      method: 'GET',
      headers,
    });

    if (res.status !== 200) {
      throw await createFacilitatorError(res, facilitatorName);
    }

    const data = (await res.json()) as SupportedPaymentKindsResponse;
    return data;
  }

  /**
   * Lists the discovery items with the facilitator service
   *
   * @param config - The configuration for the discovery list request
   * @returns A promise that resolves to the discovery list response
   */
  async function list(
    config: ListDiscoveryResourcesRequest = {}
  ): Promise<ListDiscoveryResourcesResponse> {
    const url = facilitator.url;

    let headers = { 'Content-Type': 'application/json' };
    if (facilitator?.createAuthHeaders) {
      const authHeaders = await facilitator.createAuthHeaders();
      if (authHeaders.list) {
        headers = { ...headers, ...authHeaders.list };
      }
    }

    const urlParams = new URLSearchParams(
      Object.entries(config)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, value.toString()])
    );

    const res = await fetch(
      `${url}/discovery/resources?${urlParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (res.status !== 200) {
      throw await createFacilitatorError(res, facilitatorName);
    }

    const data = (await res.json()) as ListDiscoveryResourcesResponse;
    return data;
  }

  return { verify, settle, supported, list };
}
