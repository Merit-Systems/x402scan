import { scanDb } from '@x402scan/scan-db';

import { hashClaimValue, maskEmail } from './crypto';

export interface ClaimSession {
  email: string;
  userId: string | null;
}

/** Resolve a claim-session cookie token to its identity, or null if invalid/expired. */
export async function getClaimSessionByToken(
  token: string
): Promise<ClaimSession | null> {
  const session = await scanDb.originClaimSession.findUnique({
    where: { token },
    select: { email: true, userId: true, expiresAt: true },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) {
    return null;
  }
  return { email: session.email, userId: session.userId };
}

/**
 * Whether the holder of `token` may manage `originId`. Returns the (masked)
 * verified email on success so callers can show "managing as …".
 */
export async function getOriginOwnership(
  token: string,
  originId: string
): Promise<{ isOwner: boolean; maskedEmail?: string }> {
  const session = await getClaimSessionByToken(token);
  if (!session) {
    return { isOwner: false };
  }
  const ownership = await scanDb.originOwnership.findUnique({
    where: { originId_email: { originId, email: session.email } },
    select: { id: true },
  });
  if (!ownership) {
    return { isOwner: false };
  }
  return { isOwner: true, maskedEmail: maskEmail(session.email) };
}

/** Pending (unconsumed, unexpired) claim behind a magic-link token, for the confirm page. */
export async function getPendingClaimByLinkToken(token: string): Promise<{
  originId: string;
  originHostname: string;
  maskedEmail: string;
} | null> {
  const code = await scanDb.originClaimCode.findUnique({
    where: { linkTokenHash: hashClaimValue(token) },
    select: {
      consumedAt: true,
      expiresAt: true,
      email: true,
      origin: { select: { id: true, origin: true } },
    },
  });
  if (!code || code.consumedAt || code.expiresAt.getTime() < Date.now()) {
    return null;
  }
  let originHostname: string;
  try {
    originHostname = new URL(code.origin.origin).hostname;
  } catch {
    originHostname = code.origin.origin;
  }
  return {
    originId: code.origin.id,
    originHostname,
    maskedEmail: maskEmail(code.email),
  };
}

/** Revoke a claim session (sign out). Idempotent. */
export async function revokeClaimSession(token: string): Promise<void> {
  await scanDb.originClaimSession.deleteMany({ where: { token } });
}

/** Delete expired/consumed claim codes and expired sessions. Returns counts. */
export async function sweepExpiredClaims(): Promise<{
  codes: number;
  sessions: number;
}> {
  const now = new Date();
  const [codes, sessions] = await Promise.all([
    scanDb.originClaimCode.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { consumedAt: { not: null } }],
      },
    }),
    scanDb.originClaimSession.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
  ]);
  return { codes: codes.count, sessions: sessions.count };
}
