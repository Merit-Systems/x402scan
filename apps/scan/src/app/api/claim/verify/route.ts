import z from 'zod';

import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getClientIp } from '@/lib/request-ip';
import { isSameOriginRequest } from '@/lib/same-origin';
import { claimCookieName, claimCookieOptions } from '@/services/claim/cookie';
import { CLAIM_RATE_LIMITS } from '@/services/claim/constants';
import { isWithinRateLimit } from '@/services/claim/rate-limit';
import { verifyByCode, verifyByLinkToken } from '@/services/claim/verify-claim';

import type { VerifyClaimResult } from '@/services/claim/verify-claim';
import type { NextRequest } from 'next/server';

const tokenSchema = z.object({ token: z.string().min(1) });
const codeSchema = z.object({
  originId: z.uuid(),
  code: z.string().regex(/^\d{6}$/),
});

const reasonToStatus: Record<
  Exclude<VerifyClaimResult, { ok: true }>['reason'],
  number
> = {
  invalid: 400,
  expired: 410,
  wrong_code: 401,
  too_many_attempts: 429,
};

export const POST = async (request: NextRequest) => {
  // CSRF: reject cross-site POSTs (on top of the SameSite=Lax cookie).
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  const withinVerify = await isWithinRateLimit(
    `verify:ip:${ip ?? 'unknown'}`,
    CLAIM_RATE_LIMITS.verifyPerIp
  );
  if (!withinVerify) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  let result: VerifyClaimResult;
  const asToken = tokenSchema.safeParse(body);
  if (asToken.success) {
    result = await verifyByLinkToken(asToken.data.token, userId);
  } else {
    const asCode = codeSchema.safeParse(body);
    if (!asCode.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    result = await verifyByCode(asCode.data.originId, asCode.data.code, userId);
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: reasonToStatus[result.reason] }
    );
  }

  const response = NextResponse.json({
    ok: true,
    originId: result.originId,
  });
  response.cookies.set(
    claimCookieName(),
    result.sessionToken,
    claimCookieOptions()
  );
  return response;
};
