import { describe, expect, it } from 'vitest';

import { buildBuyersOrderByColumn } from './order-by';

describe('buildBuyersOrderByColumn', () => {
  it('adds sender as a tiebreaker for descending sorts', () => {
    const orderBy = buildBuyersOrderByColumn({ id: 'tx_count', desc: true });

    expect(orderBy).toBe('"tx_count" DESC, sender ASC');
  });

  it('adds sender as a tiebreaker for ascending sorts', () => {
    const orderBy = buildBuyersOrderByColumn({ id: 'tx_count', desc: false });

    expect(orderBy).toBe('"tx_count" ASC, sender ASC');
  });
});
