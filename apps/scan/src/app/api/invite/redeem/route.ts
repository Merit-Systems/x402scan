import { NextResponse, type NextRequest } from 'next/server';
import z from 'zod';
import {
  redeemInviteCode,
  redeemInviteCodeSchema,
  validateInviteCode,
  validateInviteCodeSchema,
} from '@/services/db/invite-codes';
import { toNextResponse, dbErrorResponse } from '@/services/db/lib';

export const POST = async (request: NextRequest) => {
  try {
    const body: unknown = await request.json();
    const { code, recipientAddr } = redeemInviteCodeSchema.parse(body);
    const result = await redeemInviteCode({ code, recipientAddr });
    return toNextResponse(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return dbErrorResponse({
        type: 'invalid_request',
        message: 'Invalid request body',
      });
    }
    console.error('Failed to redeem invite code:', error);
    return dbErrorResponse({ type: 'internal', message: 'Internal server error' });
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const recipientAddr = searchParams.get('recipientAddr');

    const { code: validatedCode, recipientAddr: validatedAddr } =
      validateInviteCodeSchema.parse({
        code,
        recipientAddr: recipientAddr ?? undefined,
      });

    const result = await validateInviteCode({
      code: validatedCode,
      recipientAddr: validatedAddr,
    });

    return NextResponse.json(
      result
        .map(message => ({
          valid: true,
          message,
        }))
        .unwrapOr({ valid: false, error: 'Invalid invite code' })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    console.error('Failed to validate invite code:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};
