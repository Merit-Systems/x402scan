import { NextResponse } from 'next/server';
import {
  ERROR_NO_RPC,
  ERROR_RPC_FAILED,
  getBalance,
  USDC_DECIMALS,
} from '@/services/rpc/base/balance';
import { formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { evmAddressSchema } from '@/lib/schemas';
import { signozLogInfo } from '@/lib/telemetry/signoz-logs';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  const parsedAddress = evmAddressSchema.safeParse(address);
  if (!parsedAddress.success) {
    return NextResponse.json({ error: 'Invalid EVM address' }, { status: 400 });
  }

  const result = await getBalance(parsedAddress.data);

  return result.match(
    balance => {
      signozLogInfo('balance_request', {
        address: parsedAddress.data,
        balance: balance.toString(),
      });
      return NextResponse.json(
        {
          address: parsedAddress.data,
          chain: base.id,
          balance: formatUnits(balance, USDC_DECIMALS),
          rawBalance: balance.toString(),
        },
        { status: 200 }
      );
    },
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
}
