import { matchErrorPartial } from 'better-result';

import type { DiscoveryError } from './errors';

/**
 * Render a DiscoveryError into a user-facing message.
 *
 * Accepts either an in-process TaggedError instance or its serialized wire
 * form (`{_tag, message, ...payload}`). `matchErrorPartial` reads `_tag` at
 * runtime, so the structural shape is enough.
 *
 * Why partial-match-with-fallback rather than the exhaustive `matchError`:
 * if a future server version emits a `_tag` we don't yet know about, we'd
 * rather render a graceful message from the embedded `.message` field than
 * crash with "handler is undefined". The TS-level fallback type is `never`
 * (we exhaustively handle every variant we know), so we read `.message` via
 * a structural cast that holds for every `TaggedError`.
 */
export function discoveryErrorMessage(error: DiscoveryError): string {
  return matchErrorPartial(
    error,
    {
      LocalUrlNotSupported: e => `Local URLs aren't supported (${e.url}).`,
      InvalidUrl: e => `Enter a full URL like https://api.example.com (${e.url}).`,
      ProbeNetworkError: e => `Couldn't reach ${e.url}.`,
      ProbeTimeout: e =>
        `${e.url} didn't respond within ${Math.round(e.timeoutMs / 1000)}s.`,
      No402Challenge: e =>
        e.triedSampleBody
          ? "Endpoint accepted a sample body but never returned a 402 payment challenge."
          : 'Endpoint did not return a 402 payment challenge.',
      ProbeUnexpectedError: e => `Probe failed: ${e.message}`,
      NoPaymentOptions: () =>
        'Endpoint returned 402 but advertised no x402 payment options.',
      MissingInputSchema: e =>
        `Endpoint is missing an input schema for ${e.method}. Add an OpenAPI request body schema.`,
      UnsupportedNetwork: e =>
        `Endpoint advertises only [${e.advertisedNetworks.join(', ')}]. We index [${e.supportedNetworks.join(', ')}]. Testnets are not indexed.`,
      ResourceUpsertFailed: e => `Could not save ${e.url} to the registry.`,
    },
    e => (e as { message?: string }).message ?? 'Registration failed'
  );
}

/**
 * Type guard for a serialized DiscoveryError on the wire. Use this at every
 * deserialization boundary before passing to `discoveryErrorMessage`.
 */
export function isDiscoveryError(value: unknown): value is DiscoveryError {
  return (
    !!value &&
    typeof value === 'object' &&
    '_tag' in value &&
    typeof (value as { _tag: unknown })._tag === 'string'
  );
}

/**
 * Convert a TaggedError instance into a plain object for the wire.
 *
 * Why: SuperJSON (used as the tRPC transformer) detects `Error` subclasses
 * and routes them through its Error transformer, which keeps only
 * `name` + `message` + `stack` and drops every custom property — including
 * `_tag` and the variant payload. That collapses the typed-error wire
 * contract.
 *
 * `TaggedError.toJSON()` materializes a plain object with all custom fields,
 * which SuperJSON then treats as a POJO and round-trips intact. The cast back
 * to `DiscoveryError` is structurally honest — `discoveryErrorMessage` only
 * reads `_tag` and the typed payload, both of which are preserved.
 */
export function serializeError(error: DiscoveryError): DiscoveryError {
  return error.toJSON() as DiscoveryError;
}
