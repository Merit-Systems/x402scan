import { NextResponse } from 'next/server';
import {
  ERROR_NO_RPC,
  ERROR_RPC_FAILED,
  getBalance,
  USDC_DECIMALS,
} from '@/services/rpc/balance';
import { formatUnits, getAddress, isAddress } from 'viem';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isAddress(address)) {
    return NextResponse.json({ error: 'Invalid EVM address' }, { status: 400 });
  }

  const parsedAddress = getAddress(address);

  const balance = await getBalance(parsedAddress).match(
    balance =>
      NextResponse.json(
        {
          balance: formatUnits(balance, USDC_DECIMALS),
          rawBalance: balance.toString(),
        },
        { status: 200 }
      ),
    error => {
      switch (error.type) {
        case ERROR_NO_RPC:
          return NextResponse.json({ error: error.message }, { status: 503 });
        case ERROR_RPC_FAILED:
          return NextResponse.json({ error: error.message }, { status: 502 });
        default:
          return NextResponse.json(
            { error: 'Unhandled error' },
            { status: 500 }
          );
      }
    }
  );

  return balance;
}
