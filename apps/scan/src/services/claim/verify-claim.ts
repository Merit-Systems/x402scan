import { scanDb } from '@x402scan/scan-db';

import { generateOpaqueToken, hashClaimValue, safeHashEqual } from './crypto';
import { CLAIM_MAX_ATTEMPTS, CLAIM_SESSION_TTL_MS } from './constants';

import type { OriginClaimCode } from '@x402scan/scan-db';

export type VerifyClaimResult =
  | { ok: true; sessionToken: string; originId: string }
  | {
      ok: false;
      reason: 'invalid' | 'expired' | 'wrong_code' | 'too_many_attempts';
    };

/**
 * Atomically consumes a valid code row, then creates the verified claim session
 * and persists ownership. The optimistic `updateMany` on `consumedAt: null`
 * guarantees exactly one concurrent verification wins (no double-consume).
 */
async function finalizeClaim(
  code: OriginClaimCode,
  userId: string | null
): Promise<VerifyClaimResult> {
  const sessionToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + CLAIM_SESSION_TTL_MS);

  try {
    await scanDb.$transaction(async tx => {
      const consumed = await tx.originClaimCode.updateMany({
        where: { id: code.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new Error('already_consumed');
      }
      await tx.originOwnership.upsert({
        where: {
          originId_email: { originId: code.originId, email: code.email },
        },
        update: { ...(userId ? { userId } : {}) },
        create: { originId: code.originId, email: code.email, userId },
      });
      await tx.originClaimSession.create({
        data: { token: sessionToken, email: code.email, userId, expiresAt },
      });
    });
  } catch (error) {
    // A lost race on consumedAt is expected ('already_consumed'); anything else
    // is an infra fault worth surfacing rather than silently masking as invalid.
    const message = error instanceof Error ? error.message : String(error);
    if (message !== 'already_consumed') {
      console.error('[claim:verify] finalize failed', { message });
    }
    return { ok: false, reason: 'invalid' };
  }

  return { ok: true, sessionToken, originId: code.originId };
}

/** Verify via the magic-link token (single high-entropy value). */
export async function verifyByLinkToken(
  token: string,
  userId: string | null
): Promise<VerifyClaimResult> {
  const code = await scanDb.originClaimCode.findUnique({
    where: { linkTokenHash: hashClaimValue(token) },
  });
  if (!code || code.consumedAt) {
    return { ok: false, reason: 'invalid' };
  }
  if (code.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  return finalizeClaim(code, userId);
}

/** Verify via the 6-digit code typed for a specific origin. */
export async function verifyByCode(
  originId: string,
  submittedCode: string,
  userId: string | null
): Promise<VerifyClaimResult> {
  const code = await scanDb.originClaimCode.findFirst({
    where: { originId, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!code) {
    return { ok: false, reason: 'invalid' };
  }
  if (code.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  const matches = safeHashEqual(code.codeHash, hashClaimValue(submittedCode));
  if (!matches) {
    // Atomic increment avoids lost updates when wrong guesses race, so the
    // attempt ceiling can't be exceeded by concurrent brute-force requests.
    const updated = await scanDb.originClaimCode.update({
      where: { id: code.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const burned = updated.attempts >= CLAIM_MAX_ATTEMPTS;
    if (burned) {
      await scanDb.originClaimCode.updateMany({
        where: { id: code.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    }
    return {
      ok: false,
      reason: burned ? 'too_many_attempts' : 'wrong_code',
    };
  }

  return finalizeClaim(code, userId);
}
