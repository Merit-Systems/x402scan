import { describe, expect, it } from 'vitest';

import type {
  CheckEndpointResult,
  EndpointMethodAdvisory,
} from '@agentcash/discovery';

import { pickX402Advisory } from './probe';

const X402_PAYMENT_OPTS: EndpointMethodAdvisory['paymentOptions'] = [
  {
    protocol: 'x402',
    version: 2,
    network: 'eip155:8453',
    asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: '10000',
    scheme: 'exact',
    payTo: '0x7484b0bca25d2ee56e9b0535572d4cf44a047d98',
    maxTimeoutSeconds: 300,
  },
];

function makeAdvisory(
  method: EndpointMethodAdvisory['method'],
  inputSchema?: Record<string, unknown>
): EndpointMethodAdvisory {
  return {
    source: 'probe',
    method,
    authMode: 'paid',
    paymentOptions: X402_PAYMENT_OPTS,
    ...(inputSchema ? { inputSchema } : {}),
  };
}

function makeResult(advisories: EndpointMethodAdvisory[]): CheckEndpointResult {
  return {
    found: true,
    origin: 'https://example.test',
    path: '/paid/endpoint',
    advisories,
  };
}

describe('pickX402Advisory', () => {
  it('returns undefined when discovery did not find the endpoint', () => {
    expect(
      pickX402Advisory({
        found: false,
        origin: 'https://example.test',
        path: '/paid/endpoint',
        cause: 'not_found',
      })
    ).toBeUndefined();
  });

  it('returns undefined when no advisories carry x402 payment options', () => {
    const result: CheckEndpointResult = makeResult([
      {
        source: 'probe',
        method: 'POST',
        authMode: 'paid',
        paymentOptions: [],
      },
    ]);
    expect(pickX402Advisory(result)).toBeUndefined();
  });

  it('prefers POST over GET when no method is declared by the spec', () => {
    const get = makeAdvisory('GET', { type: 'object' });
    const post = makeAdvisory('POST', { type: 'string' });
    const picked = pickX402Advisory(makeResult([get, post]));
    expect(picked?.method).toBe('POST');
    expect(picked?.inputSchema).toEqual({ type: 'string' });
  });

  // Regression: GoldBean API (https://goldbean-api.xyz) issue #923.
  //
  // The OpenAPI spec declares only GET on /paid/* endpoints, but the
  // payment middleware returns 402 for every HTTP method. The probe
  // therefore yields advisories for both GET (with `inputSchema`
  // populated from the spec's query parameters) and POST (with no
  // `inputSchema` because no POST is declared).
  //
  // Before the fix, pickX402Advisory picked the POST advisory by
  // method preference, rewrote `.method` to "GET" from the declared
  // OpenAPI method, and registered the endpoint without a schema —
  // surfacing "Missing input schema" on every GET endpoint.
  //
  // Expected: when `preferredMethod` matches an advisory directly,
  // return that advisory unchanged so the per-method `inputSchema`
  // survives.
  it('prefers the advisory whose method matches `preferredMethod`', () => {
    const get = makeAdvisory('GET', {
      parameters: [{ name: 'address', in: 'query' }],
    });
    const post = makeAdvisory('POST'); // no inputSchema — only declared on GET
    const picked = pickX402Advisory(makeResult([get, post]), 'GET');
    expect(picked?.method).toBe('GET');
    expect(picked?.inputSchema).toEqual({
      parameters: [{ name: 'address', in: 'query' }],
    });
  });

  it('keeps the case-insensitive match for `preferredMethod`', () => {
    const get = makeAdvisory('GET', { type: 'object' });
    const post = makeAdvisory('POST');
    const picked = pickX402Advisory(makeResult([get, post]), 'get');
    expect(picked?.method).toBe('GET');
    expect(picked?.inputSchema).toEqual({ type: 'object' });
  });

  // When the OpenAPI spec declares a method that the probe did not
  // see (e.g. middleware order means only one method actually 402s),
  // fall back to the most-preferred candidate and rewrite `.method` so
  // the registered resource reflects the declared method. The schema
  // is whatever the probe found — better than dropping the endpoint.
  it('falls back to method-preference and rewrites .method when no advisory matches `preferredMethod`', () => {
    const patch = makeAdvisory('PATCH');
    const put = makeAdvisory('PUT');
    const picked = pickX402Advisory(makeResult([patch, put]), 'POST');
    // PUT > PATCH in METHOD_PREFERENCE, so PUT wins…
    expect(picked?.method).toBe('POST'); // …but `.method` is rewritten to the declared method.
  });

  it('returns the only candidate when its method does not match `preferredMethod` and is outside METHOD_PREFERENCE order', () => {
    const options = makeAdvisory('OPTIONS' as EndpointMethodAdvisory['method']);
    const picked = pickX402Advisory(makeResult([options]), 'GET');
    expect(picked?.method).toBe('GET'); // rewritten to declared method
  });
});
