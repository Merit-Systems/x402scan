import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';

import { recoverRecipientsFromProofs } from './ownership-proof';

const ORIGIN = 'https://merchant.example';

const proxy = privateKeyToAccount(
  '0x0000000000000000000000000000000000000000000000000000000000000001'
);
const merchant = privateKeyToAccount(
  '0x0000000000000000000000000000000000000000000000000000000000000002'
);
const otherMerchant = privateKeyToAccount(
  '0x0000000000000000000000000000000000000000000000000000000000000003'
);

describe('recoverRecipientsFromProofs', () => {
  it('returns the signer of a proof that is not a payTo', async () => {
    const proof = await merchant.signMessage({ message: ORIGIN });

    const recipients = await recoverRecipientsFromProofs([proof], ORIGIN, [
      proxy.address,
    ]);

    expect(recipients).toEqual([
      { address: merchant.address.toLowerCase(), proof },
    ]);
  });

  it('skips a proof signed by a payTo, whatever its casing', async () => {
    const proof = await proxy.signMessage({ message: ORIGIN });

    const recipients = await recoverRecipientsFromProofs([proof], ORIGIN, [
      proxy.address.toLowerCase(),
    ]);

    expect(recipients).toEqual([]);
  });

  it('attributes a proof of another origin to a different signer', async () => {
    // Recovery always succeeds, so a proof over the wrong message yields an
    // unrelated address rather than the merchant's.
    const proof = await merchant.signMessage({
      message: 'https://other.example',
    });

    const recipients = await recoverRecipientsFromProofs([proof], ORIGIN, [
      proxy.address,
    ]);

    expect(recipients.map(r => r.address)).not.toContain(
      merchant.address.toLowerCase()
    );
  });

  it('returns each signer once, with its first proof', async () => {
    const first = await merchant.signMessage({ message: ORIGIN });
    const second = await otherMerchant.signMessage({ message: ORIGIN });

    const recipients = await recoverRecipientsFromProofs(
      [first, second, first],
      ORIGIN,
      [proxy.address]
    );

    expect(recipients).toEqual([
      { address: merchant.address.toLowerCase(), proof: first },
      { address: otherMerchant.address.toLowerCase(), proof: second },
    ]);
  });

  it('ignores malformed and non-EVM proofs', async () => {
    const recipients = await recoverRecipientsFromProofs(
      ['0xdeadbeef', '3yZe7d2k9Fvq', ''],
      ORIGIN,
      [proxy.address]
    );

    expect(recipients).toEqual([]);
  });
});
