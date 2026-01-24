import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logBalanceCheck } from '@/services/db/balance-checks';

const balanceCheckSchema = z.object({
  wallet: z.string(),
  chain: z.string(),
});

export const POST = async (request: NextRequest) => {
  try {
    const body: unknown = await request.json();
    const parsed = balanceCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid balance check format',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { wallet, chain } = parsed.data;

    await logBalanceCheck(wallet, chain);

    return NextResponse.json({
      success: true,
      message: 'Balance check logged',
    });
  } catch (error) {
    console.error('[balance-check] Failed to log balance check', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to log balance check',
      },
      { status: 500 }
    );
  }
};
