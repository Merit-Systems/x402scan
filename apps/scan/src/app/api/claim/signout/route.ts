import { NextResponse } from 'next/server';

import { isSameOriginRequest } from '@/lib/same-origin';
import {
  claimCookieClearOptions,
  claimCookieName,
  readClaimToken,
} from '@/services/claim/cookie';
import { revokeClaimSession } from '@/services/claim/session';

import type { NextRequest } from 'next/server';

export const POST = async (request: NextRequest) => {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = readClaimToken(request.headers);
  if (token) {
    await revokeClaimSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(claimCookieName(), '', claimCookieClearOptions());
  return response;
};
