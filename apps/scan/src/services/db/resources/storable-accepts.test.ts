import { describe, expect, it } from 'vitest';

import { fitsInt64Amount, selectStorableAccepts } from './storable-accepts';

const usdcBase = {
  scheme: 'exact',
  network: 'base',
  maxAmountRequired: '10000',
};

describe('selectStorableAccepts', () => {
  it('keeps a storable accept even when the same resource also offers an 18-decimal token above int64', () => {
    // e.g. an 18-decimal peso stablecoin on Base priced at 30.34 tokens = 3.034e19 atomic units
    const wcopBase = {
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '30340000000000000000',
    };
    expect(selectStorableAccepts([wcopBase]).skipped).toEqual([
      { accept: wcopBase, reason: 'amount_exceeds_int64' },
    ]);
    const { storable } = selectStorableAccepts([wcopBase, usdcBase]);
    expect(storable).toEqual([usdcBase]);
  });

  it('keeps only the first accept per (scheme, network) so a later token cannot overwrite USDC', () => {
    const mxnbBase = {
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '92100',
    };
    const { storable, skipped } = selectStorableAccepts([usdcBase, mxnbBase]);
    expect(storable).toEqual([usdcBase]);
    expect(skipped[0]?.reason).toBe('duplicate_scheme_network');
  });

  it('still skips unsupported networks', () => {
    const celo = {
      scheme: 'exact',
      network: 'eip155:42220',
      maxAmountRequired: '1',
    };
    expect(selectStorableAccepts([celo]).skipped[0]?.reason).toBe(
      'unsupported_network'
    );
  });
});

describe('fitsInt64Amount', () => {
  it('accepts the int64 boundary and rejects one above it', () => {
    expect(fitsInt64Amount('9223372036854775807')).toBe(true);
    expect(fitsInt64Amount('9223372036854775808')).toBe(false);
  });
  it('rejects non-integer strings', () => {
    for (const bad of ['', '-1', '1.5', '1e3', '0x10', ' 1'])
      expect(fitsInt64Amount(bad)).toBe(false);
  });
});
