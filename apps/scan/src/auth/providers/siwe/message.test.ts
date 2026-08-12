import { describe, expect, it } from 'vitest';
import { createSiweMessage } from './message';

describe('createSiweMessage', () => {
  it('creates a valid message with an issued-at timestamp', () => {
    const now = new Date('2026-07-10T12:00:00.000Z');
    const message = createSiweMessage({
      domain: 'www.x402scan.com',
      uri: 'https://www.x402scan.com',
      address: '0x0000000000000000000000000000000000000000',
      chainId: 8453,
      nonce: 'aBcDeFgH',
      now,
    });

    expect(message.prepareMessage()).toContain(
      'Issued At: 2026-07-10T12:00:00.000Z'
    );
    expect(message.expirationTime).toBe('2026-07-10T14:00:00.000Z');
  });
});
