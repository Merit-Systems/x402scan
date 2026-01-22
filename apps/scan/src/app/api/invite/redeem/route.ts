import z from 'zod';

import {
  redeemInviteCode,
  redeemInviteCodeSchema,
  validateInviteCode,
  validateInviteCodeSchema,
} from '@/services/db/invite-codes';

import { toNextResponse } from '../../_lib/result';
import { apiErr } from '../../_lib/result';

import type { NextRequest } from 'next/server';

export const POST = async (request: NextRequest) => {
  const parseResult = redeemInviteCodeSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return toNextResponse(
      apiErr({
        cause: 'invalid_request',
        message: JSON.stringify(z.treeifyError(parseResult.error)),
      })
    );
  }

  const { code, recipientAddr } = parseResult.data;

  const result = await redeemInviteCode({ code, recipientAddr });
  return toNextResponse(result);
};

export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  const parseResult = validateInviteCodeSchema.safeParse({
    code: searchParams.get('code'),
    recipientAddr: searchParams.get('recipientAddr') ?? undefined,
  });

  if (!parseResult.success) {
    return toNextResponse(
      apiErr({
        cause: 'invalid_request',
        message: JSON.stringify(z.treeifyError(parseResult.error)),
      })
    );
  }

  const { code, recipientAddr } = parseResult.data;
  const result = await validateInviteCode({ code, recipientAddr });
  return toNextResponse(result);
};
