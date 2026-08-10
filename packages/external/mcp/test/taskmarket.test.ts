import { describe, expect, it } from 'vitest';

import {
  buildTaskmarketListUrl,
  formatUsdc,
} from '../src/server/tools/taskmarket';

describe('Taskmarket tools', () => {
  it('formats USDC base units without floating-point rounding', () => {
    expect(formatUsdc('40000000')).toBe('40');
    expect(formatUsdc('4162500')).toBe('4.1625');
    expect(formatUsdc('1')).toBe('0.000001');
  });

  it('builds a bounded, read-only public task query', () => {
    const url = new URL(
      buildTaskmarketListUrl({
        limit: 12,
        mode: 'bounty',
        tags: ['agents', 'x402'],
        deadlineHours: 72,
        sort: 'deadline_asc',
      })
    );

    expect(url.origin).toBe('https://api.taskmarket.dev');
    expect(url.pathname).toBe('/api/tasks');
    expect(url.searchParams.get('status')).toBe('open');
    expect(url.searchParams.get('limit')).toBe('12');
    expect(url.searchParams.get('mode')).toBe('bounty');
    expect(url.searchParams.get('deadlineHours')).toBe('72');
    expect(url.searchParams.get('sort')).toBe('deadline_asc');
    expect(url.searchParams.getAll('tags')).toEqual(['agents', 'x402']);
  });

  it('uses conservative defaults for task discovery', () => {
    const url = new URL(buildTaskmarketListUrl({}));

    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('status')).toBe('open');
    expect(url.searchParams.get('sort')).toBe('reward_desc');
  });
});
