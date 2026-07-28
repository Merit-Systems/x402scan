/**
 * Shared constants for the origin-claim magic-link flow.
 */

/** httpOnly cookie holding the claim-session token. */
export const CLAIM_COOKIE_NAME = 'x402_claim';

/** `__Host-` prefix hardens the cookie in production (Secure + Path=/ + no Domain). */
export const CLAIM_COOKIE_NAME_PROD = `__Host-${CLAIM_COOKIE_NAME}`;

/** One-time codes are valid for 10 minutes. */
export const CLAIM_CODE_TTL_MS = 10 * 60 * 1000;

/** A verified claim session lasts 7 days. */
export const CLAIM_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Max wrong-code submissions against a single code before it is burned. */
export const CLAIM_MAX_ATTEMPTS = 5;

/** Number of digits in the one-time code. */
export const CLAIM_CODE_DIGITS = 6;

/** Hard cap on how long we wait for the email provider before giving up. */
export const CLAIM_EMAIL_TIMEOUT_MS = 8000;

/**
 * Rate-limit budgets. Window is in ms, max is the number of allowed events in
 * that window. Sending a code is constrained per-origin/email/ip; verifying is
 * constrained per-ip to blunt enumeration independent of the per-code cap.
 */
export const CLAIM_RATE_LIMITS = {
  requestPerOrigin: { max: 5, windowMs: 60 * 60 * 1000 },
  requestPerEmail: { max: 5, windowMs: 60 * 60 * 1000 },
  requestPerIp: { max: 10, windowMs: 60 * 60 * 1000 },
  verifyPerIp: { max: 20, windowMs: 10 * 60 * 1000 },
} as const;
