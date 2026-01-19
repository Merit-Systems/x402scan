import { NextResponse, type NextRequest } from 'next/server';
import z from 'zod';
import { redeemInviteCode, validateInviteCode } from '@/services/db/invite-codes';
import { mixedAddressSchema } from '@/lib/schemas';

const redeemSchema = z.object({
  code: z.string().min(1),
  recipientAddr: mixedAddressSchema,
});

const validateSchema = z.object({
  code: z.string().min(1),
  recipientAddr: mixedAddressSchema.optional(),
});

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { code, recipientAddr } = redeemSchema.parse(body);

    const result = await redeemInviteCode({
      code,
      recipientAddr,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      redemptionId: result.redemptionId,
      txHash: result.txHash,
      amount: result.amount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to redeem invite code:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const recipientAddr = searchParams.get('recipientAddr');

    const { code: validatedCode, recipientAddr: validatedAddr } =
      validateSchema.parse({
        code,
        recipientAddr: recipientAddr || undefined,
      });

    const result = await validateInviteCode(validatedCode, validatedAddr);

    return NextResponse.json(result);
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
