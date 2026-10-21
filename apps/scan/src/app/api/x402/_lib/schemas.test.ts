import { describe, expect, it } from 'vitest';

import {
  registryOriginQuerySchema,
  resourcesListQuerySchema,
  walletTransactionsQuerySchema,
} from './schemas';

describe('Arc discovery boundary', () => {
  it('allows Arc in resource queries but rejects it for wallet transactions', () => {
    expect(resourcesListQuerySchema.safeParse({ chain: 'arc' }).success).toBe(
      true
    );
    expect(
      registryOriginQuerySchema.safeParse({
        url: 'https://api-staging.aomi.dev',
        chain: 'arc',
      }).success
    ).toBe(true);
    expect(
      walletTransactionsQuerySchema.safeParse({ chain: 'arc' }).success
    ).toBe(false);
  });
});
