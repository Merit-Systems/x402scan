import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'https://www.x402scan.com' },
}));
vi.mock('@/lib/redis', () => ({ getRedisClient: () => null }));

import {
  checkRateLimit,
  clientKey,
  rateLimitHeaders,
  resetMemoryRateLimitStore,
} from './rate-limit';
import { RATE_LIMIT } from './rate-limit-policy';

describe('checkRateLimit (in-memory store)', () => {
  afterEach(() => resetMemoryRateLimitStore());

  const memory = new Map<string, number>();
  const store = {
    increment(key: string) {
      const next = (memory.get(key) ?? 0) + 1;
      memory.set(key, next);
      return Promise.resolve(next);
    },
  };

  it('counts down remaining and limits after the configured number', async () => {
    memory.clear();
    const now = 1_700_000_000_000;
    let last = await checkRateLimit('1.2.3.4', now, store);
    expect(last.limited).toBe(false);
    expect(last.remaining).toBe(RATE_LIMIT.limit - 1);
    for (let i = 1; i < RATE_LIMIT.limit; i++) {
      last = await checkRateLimit('1.2.3.4', now, store);
    }
    expect(last.remaining).toBe(0);
    expect(last.limited).toBe(false);
    const over = await checkRateLimit('1.2.3.4', now, store);
    expect(over.limited).toBe(true);
    expect(over.remaining).toBe(0);
  });

  it('keys windows by time so the count resets', async () => {
    memory.clear();
    const now = 1_700_000_000_000;
    await checkRateLimit('a', now, store);
    const later = await checkRateLimit(
      'a',
      now + RATE_LIMIT.windowSeconds * 1000,
      store
    );
    expect(later.remaining).toBe(RATE_LIMIT.limit - 1);
  });

  it('computes seconds until the window resets', async () => {
    memory.clear();
    const windowMs = RATE_LIMIT.windowSeconds * 1000;
    const start = Math.floor(1_700_000_000_000 / windowMs) * windowMs;
    const r = await checkRateLimit('b', start + 10_000, store);
    expect(r.resetSeconds).toBe(RATE_LIMIT.windowSeconds - 10);
  });

  it('fails open when the store throws', async () => {
    const broken = {
      increment: () => Promise.reject(new Error('redis down')),
    };
    const r = await checkRateLimit('c', Date.now(), broken);
    expect(r.limited).toBe(false);
  });

  it('uses the process-local fallback store when none is injected', async () => {
    const first = await checkRateLimit('local', 1_700_000_000_000);
    const second = await checkRateLimit('local', 1_700_000_000_000);
    expect(second.remaining).toBe(first.remaining - 1);
  });
});

describe('rateLimitHeaders', () => {
  it('emits IETF RateLimit fields plus X-RateLimit aliases', () => {
    const headers = rateLimitHeaders({
      limited: false,
      limit: 120,
      remaining: 119,
      resetSeconds: 42,
    });
    expect(headers).toEqual({
      'RateLimit-Policy': '"default";q=120;w=60',
      RateLimit: '"default";r=119;t=42',
      'X-RateLimit-Limit': '120',
      'X-RateLimit-Remaining': '119',
      'X-RateLimit-Reset': '42',
    });
  });

  it('adds Retry-After only when limited', () => {
    const headers = rateLimitHeaders({
      limited: true,
      limit: 120,
      remaining: 0,
      resetSeconds: 7,
    });
    expect(headers['Retry-After']).toBe('7');
  });
});

describe('clientKey', () => {
  it('prefers the first X-Forwarded-For hop', () => {
    const req = new Request('https://x402scan.com/api/x402/buyers', {
      headers: {
        'x-forwarded-for': '9.9.9.9, 10.0.0.1',
        'x-real-ip': '8.8.8.8',
      },
    });
    expect(clientKey(req)).toBe('9.9.9.9');
  });

  it('falls back to X-Real-IP then a shared bucket', () => {
    expect(
      clientKey(
        new Request('https://x402scan.com/', {
          headers: { 'x-real-ip': '8.8.8.8' },
        })
      )
    ).toBe('8.8.8.8');
    expect(clientKey(new Request('https://x402scan.com/'))).toBe('anonymous');
  });
});
