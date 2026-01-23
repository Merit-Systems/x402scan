import { erc20Abi } from 'viem';
import { base } from 'viem/chains';

import z from 'zod';

import { rpcResultFromPromise } from '@/services/rpc/result';
import { baseRpc } from '@/services/rpc/base';

import { evmAddressSchema } from '@/lib/schemas';
import { convertTokenAmount } from '@/lib/token';
import { usdc } from '@/lib/tokens/usdc';

import { Chain } from '@/types/chain';

import { apiErr, toNextResponse } from '@/app/api/_lib/result';
import { serverOk } from '@/lib/server-result';

import { signozLogInfo } from '@/lib/telemetry/signoz/logs';
import { BALANCE_REQUEST } from '@/lib/telemetry/signoz/types';

import type { Address } from 'viem';

export async function GET(
  _: Request,
  { params }: RouteContext<'/api/rpc/balance/[address]'>
) {
  const { address } = await params;

  const parseResult = evmAddressSchema.safeParse(address);
  if (!parseResult.success) {
    return toNextResponse(
      apiErr('balance', {
        cause: 'invalid_request',
        message: JSON.stringify(z.treeifyError(parseResult.error)),
      })
    );
  }

  const result = await rpcResultFromPromise(
    'balance',
    baseRpc.readContract({
      address: usdc(Chain.BASE).address as Address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [parseResult.data],
    }),
    (error: unknown) => ({
      cause: 'bad_gateway',
      message: `RPC balanceOf call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  )
    .andThen(balance => {
      return serverOk({
        chain: base.id,
        balance: convertTokenAmount(balance),
      });
    })
    .andTee(result => {
      signozLogInfo(BALANCE_REQUEST, {
        address: parseResult.data,
        balance: result.balance.toString(),
      });
    });

  return toNextResponse(result);
}
