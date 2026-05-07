/**
 * Verify that DiscoveryError variants survive a SuperJSON round-trip with
 * `_tag` + payload intact — that's the contract tRPC relies on.
 *
 * SuperJSON's default Error transformer drops custom properties (only `name`
 * and `message` survive), so passing TaggedError instances directly is broken
 * for our wire format. Instead, server-side code must call `serializeError`
 * (which materializes via `.toJSON()`) before handing the value to tRPC. The
 * resulting plain object is treated as a POJO and round-trips intact.
 */
import { describe, it, expect } from 'vitest';
import SuperJSON from 'superjson';
import {
  ProbeTimeout,
  UnsupportedNetwork,
  MissingInputSchema,
} from './errors';
import { serializeError } from './error-message';

describe('DiscoveryError SuperJSON round-trip via serializeError', () => {
  it('preserves _tag and payload on ProbeTimeout', () => {
    const original = new ProbeTimeout({
      url: 'https://api.example.com/pay',
      timeoutMs: 10000,
      message: 'timed out',
    });
    const wire = SuperJSON.stringify({ error: serializeError(original) });
    const parsed = SuperJSON.parse<{ error: unknown }>(wire);
    expect(parsed.error).toMatchObject({
      _tag: 'ProbeTimeout',
      url: 'https://api.example.com/pay',
      timeoutMs: 10000,
      message: 'timed out',
    });
  });

  it('preserves arrays in UnsupportedNetwork payload', () => {
    const original = new UnsupportedNetwork({
      url: 'https://api.example.com/pay',
      advertisedNetworks: ['solana_devnet'],
      supportedNetworks: ['base', 'solana'],
      message: 'bad networks',
    });
    const wire = SuperJSON.stringify({ error: serializeError(original) });
    const parsed = SuperJSON.parse<{ error: unknown }>(wire);
    expect(parsed.error).toMatchObject({
      _tag: 'UnsupportedNetwork',
      advertisedNetworks: ['solana_devnet'],
      supportedNetworks: ['base', 'solana'],
    });
  });

  it('preserves _tag and method on MissingInputSchema', () => {
    const original = new MissingInputSchema({
      url: 'https://api.example.com/pay',
      method: 'POST',
      message: 'no schema',
    });
    const wire = SuperJSON.stringify({ error: serializeError(original) });
    const parsed = SuperJSON.parse<{ error: unknown }>(wire);
    expect(parsed.error).toMatchObject({
      _tag: 'MissingInputSchema',
      method: 'POST',
    });
  });

  it('passing the raw instance LOSES payload — regression guard', () => {
    // This is the bug we're guarding against: SuperJSON's Error handler keeps
    // only name+message+stack. If anyone forgets `serializeError`, this test
    // anchors what NOT to do.
    const original = new ProbeTimeout({
      url: 'https://api.example.com/pay',
      timeoutMs: 10000,
      message: 'timed out',
    });
    const wire = SuperJSON.stringify({ error: original });
    const parsed = SuperJSON.parse<{ error: { _tag?: string } }>(wire);
    expect(parsed.error._tag).toBeUndefined();
  });
});
