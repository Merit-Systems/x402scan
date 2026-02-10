import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    version: 1,
    description:
      'x402scan — Send USDC to any address on Base or Solana via the x402 payment protocol.',
    instructions:
      'Use POST /api/send with query parameters: address (recipient), amount (USDC amount), chain (base or solana). The x402 payment itself IS the transfer — no additional logic needed.',
    resources: ['POST /api/send'],
    ownershipProofs: [],
  });
}
