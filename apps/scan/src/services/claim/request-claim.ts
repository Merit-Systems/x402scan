import { scanDb } from '@x402scan/scan-db';

import { env } from '@/env';
import { fetchDiscoveryDocument } from '@/services/discovery/fetch-discovery';
import { sendClaimCode } from '@/services/email/send-claim-code';

import {
  generateClaimCode,
  generateOpaqueToken,
  hashClaimValue,
  maskEmail,
  normalizeEmail,
} from './crypto';
import { CLAIM_CODE_TTL_MS, CLAIM_RATE_LIMITS } from './constants';
import { countRecentClaimCodes, isWithinRateLimit } from './rate-limit';

export type RequestClaimResult =
  | { ok: true; maskedEmail: string }
  | {
      ok: false;
      reason: 'not_found' | 'no_email' | 'rate_limited' | 'send_failed';
    };

function hostnameOf(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}

/**
 * Issues a one-time claim code for an origin and emails it to the contact
 * address in the origin's *live* openapi.json (never the mutable DB mirror).
 * Invalidates any prior unconsumed code for the origin so only one is active.
 */
export async function requestClaim({
  originId,
  ip,
}: {
  originId: string;
  ip: string | null;
}): Promise<RequestClaimResult> {
  const origin = await scanDb.resourceOrigin.findUnique({
    where: { id: originId },
    select: { id: true, origin: true },
  });
  if (!origin) {
    return { ok: false, reason: 'not_found' };
  }

  // Cheap limits before the live fetch, so we don't hammer merchant servers.
  const withinOrigin = await isWithinRateLimit(
    `req:origin:${originId}`,
    CLAIM_RATE_LIMITS.requestPerOrigin,
    () =>
      countRecentClaimCodes(
        { originId },
        CLAIM_RATE_LIMITS.requestPerOrigin.windowMs
      ).then(n => n < CLAIM_RATE_LIMITS.requestPerOrigin.max)
  );
  const withinIp = ip
    ? await isWithinRateLimit(
        `req:ip:${ip}`,
        CLAIM_RATE_LIMITS.requestPerIp,
        () =>
          countRecentClaimCodes(
            { ip },
            CLAIM_RATE_LIMITS.requestPerIp.windowMs
          ).then(n => n < CLAIM_RATE_LIMITS.requestPerIp.max)
      )
    : true;
  if (!withinOrigin || !withinIp) {
    return { ok: false, reason: 'rate_limited' };
  }

  const discovery = await fetchDiscoveryDocument(origin.origin, true);
  if (!discovery.contactEmail) {
    return { ok: false, reason: 'no_email' };
  }
  const email = normalizeEmail(discovery.contactEmail);

  const withinEmail = await isWithinRateLimit(
    `req:email:${email}`,
    CLAIM_RATE_LIMITS.requestPerEmail,
    () =>
      countRecentClaimCodes(
        { email },
        CLAIM_RATE_LIMITS.requestPerEmail.windowMs
      ).then(n => n < CLAIM_RATE_LIMITS.requestPerEmail.max)
  );
  if (!withinEmail) {
    return { ok: false, reason: 'rate_limited' };
  }

  const code = generateClaimCode();
  const linkToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + CLAIM_CODE_TTL_MS);

  await scanDb.$transaction(async tx => {
    await tx.originClaimCode.updateMany({
      where: { originId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.originClaimCode.create({
      data: {
        originId,
        email,
        codeHash: hashClaimValue(code),
        linkTokenHash: hashClaimValue(linkToken),
        expiresAt,
        ip,
      },
    });
  });

  const magicLink = `${env.NEXT_PUBLIC_APP_URL}/claim/verify?token=${linkToken}`;
  const sent = await sendClaimCode({
    to: email,
    code,
    magicLink,
    originHostname: hostnameOf(origin.origin),
  });
  if (!sent) {
    return { ok: false, reason: 'send_failed' };
  }

  return { ok: true, maskedEmail: maskEmail(email) };
}
