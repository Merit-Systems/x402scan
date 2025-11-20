import { NextResponse, type NextRequest } from 'next/server';

import { sendUsdcQueryParamsSchema } from '@/lib/schemas';

export const POST = async (request: NextRequest) => {
  const { amount, address, chain } = sendUsdcQueryParamsSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  return NextResponse.json({
    success: true,
    message: `${amount} USDC sent to ${address} on ${chain}`,
  });
};
