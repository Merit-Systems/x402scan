import { TaggedError } from 'better-result';

import type { SerializedErr } from 'better-result';

// ─── Probe-side errors ─────────────────────────────────────────────────────

export class LocalUrlNotSupported extends TaggedError('LocalUrlNotSupported')<{
  url: string;
  message: string;
}>() {}

export class InvalidUrl extends TaggedError('InvalidUrl')<{
  url: string;
  message: string;
}>() {}

export class ProbeNetworkError extends TaggedError('ProbeNetworkError')<{
  url: string;
  message: string;
}>() {}

export class ProbeTimeout extends TaggedError('ProbeTimeout')<{
  url: string;
  timeoutMs: number;
  message: string;
}>() {}

export class No402Challenge extends TaggedError('No402Challenge')<{
  url: string;
  triedSampleBody: boolean;
  message: string;
}>() {}

// Distinct from `No402Challenge`: we got 402 but the response wasn't a valid
// x402 advisory at all (e.g. malformed body). Surfaces probe failures that
// aren't "no challenge" but also aren't an x402 advisory we can use.
export class ProbeUnexpectedError extends TaggedError('ProbeUnexpectedError')<{
  url: string;
  message: string;
}>() {}

export type ProbeError =
  | LocalUrlNotSupported
  | InvalidUrl
  | ProbeNetworkError
  | ProbeTimeout
  | No402Challenge
  | ProbeUnexpectedError;

// ─── Register-side errors ──────────────────────────────────────────────────

export class NoPaymentOptions extends TaggedError('NoPaymentOptions')<{
  url: string;
  message: string;
}>() {}

export class MissingInputSchema extends TaggedError('MissingInputSchema')<{
  url: string;
  method: string;
  message: string;
}>() {}

export class UnsupportedNetwork extends TaggedError('UnsupportedNetwork')<{
  url: string;
  advertisedNetworks: readonly string[];
  supportedNetworks: readonly string[];
  message: string;
}>() {}

export class ResourceUpsertFailed extends TaggedError('ResourceUpsertFailed')<{
  url: string;
  message: string;
}>() {}

export type RegisterError =
  | NoPaymentOptions
  | MissingInputSchema
  | UnsupportedNetwork
  | ResourceUpsertFailed;

// ─── Combined union for orchestration / UI dispatch ────────────────────────

export type DiscoveryError = ProbeError | RegisterError;

/**
 * Wire shape for a discovery error after `Result.serialize`. The runtime value
 * is a plain object with `_tag` plus the variant payload — no Error instance.
 * `matchError` only reads `_tag`, so this can be passed in directly under a
 * `DiscoveryError` type assertion at the deserialization boundary.
 */
export type SerializedDiscoveryError = SerializedErr<DiscoveryError>;
