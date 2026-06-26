import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';

import { env } from '@/env';

import { CLAIM_CODE_DIGITS } from './constants';

/**
 * Server secret that keys every HMAC in the claim flow. Required in production
 * (see env.ts); throwing here surfaces a misconfiguration loudly rather than
 * silently degrading to an empty key.
 */
function claimSecret(): string {
  const secret = env.CLAIM_SECRET;
  if (!secret) {
    throw new Error('CLAIM_SECRET is not set');
  }
  return secret;
}

/** Cryptographically-random numeric code, zero-padded to CLAIM_CODE_DIGITS. */
export function generateClaimCode(): string {
  const max = 10 ** CLAIM_CODE_DIGITS;
  return randomInt(0, max).toString().padStart(CLAIM_CODE_DIGITS, '0');
}

/** High-entropy, URL-safe token for the magic link and the session cookie. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

/** HMAC-SHA256 of a value under CLAIM_SECRET. Codes/tokens are only ever stored hashed. */
export function hashClaimValue(value: string): string {
  return createHmac('sha256', claimSecret()).update(value).digest('hex');
}

/** Constant-time comparison of two already-hashed (hex) values. */
export function safeHashEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Normalize an email for storage/comparison so casing never splits ownership. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Mask an email for display: `lucas@example.com` -> `l••••@example.com`. The
 * contact email is public (it lives in the origin's openapi.json), so this is a
 * UX nicety, not a secrecy boundary.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return email;
  }
  const head = local.slice(0, 1);
  return `${head}${'•'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
}
