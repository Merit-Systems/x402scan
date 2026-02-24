import { NextResponse, type NextRequest } from 'next/server';

import { sendUsdcQueryParamsSchema } from '@/lib/schemas';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS = () =>
  new NextResponse(null, { status: 204, headers: corsHeaders });

export const POST = (request: NextRequest) => {
  const { amount, address, chain } = sendUsdcQueryParamsSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  return NextResponse.json(
    {
      success: true,
      message: `${amount} USDC sent to ${address} on ${chain}`,
    },
    { headers: corsHeaders }
  );
};
