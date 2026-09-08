import { describe, expect, it } from 'vitest';

import { buildSellersOrderByColumn } from './order-by';

describe('buildSellersOrderByColumn', () => {
  it('adds recipient as a tiebreaker for descending sorts', () => {
    const orderBy = buildSellersOrderByColumn({ id: 'tx_count', desc: true });

    expect(orderBy).toBe('"tx_count" DESC, recipient ASC');
  });

  it('adds recipient as a tiebreaker for ascending sorts', () => {
    const orderBy = buildSellersOrderByColumn({ id: 'tx_count', desc: false });

    expect(orderBy).toBe('"tx_count" ASC, recipient ASC');
  });

  it('does not duplicate recipient for editorial sorts', () => {
    const orderBy = buildSellersOrderByColumn({ id: 'editorial', desc: true });

    expect(orderBy).toBe('"recipient" ASC');
  });
});
