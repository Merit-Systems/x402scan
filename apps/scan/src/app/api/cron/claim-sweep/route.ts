import { NextResponse } from 'next/server';

import { checkCronSecret } from '@/lib/cron';
import { sweepExpiredClaims } from '@/services/claim/session';

import type { NextRequest } from 'next/server';

/**
 * Deletes expired/consumed claim codes and expired claim sessions so neither
 * table grows unbounded. Idempotent; safe to run on a schedule.
 */
export async function GET(request: NextRequest) {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  const swept = await sweepExpiredClaims();
  console.log('[claim:sweep] deleted', swept);
  return NextResponse.json({ success: true as const, ...swept });
}
