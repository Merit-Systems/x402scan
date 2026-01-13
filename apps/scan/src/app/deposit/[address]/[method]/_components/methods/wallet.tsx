'use client';

import z from 'zod';

import { useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog, erc20Abi, formatUnits } from 'viem';

import { DepositStatus } from '../status';

import { OnrampMethods } from '@/services/onramp/types';

import type { Address } from 'viem';
import type { MethodComponentProps } from '../../_types';
import { useMemo } from 'react';

const paramsSchema = z.object({
  hash: z.string(),
});

export const Wallet: React.FC<MethodComponentProps> = ({
  searchParams,
  address,
}) => {
  const parsedParams = paramsSchema.safeParse(searchParams);

  if (!parsedParams.success) {
    return <p>Invalid parameters</p>;
  }

  const { hash } = parsedParams.data;

  return <WalletSessionContent hash={hash} address={address} />;
};

const WalletSessionContent: React.FC<{ hash: string; address: Address }> = ({
  hash,
  address,
}) => {
  const { data: txnReceipt, isLoading } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}`,
  });

  const amount = useMemo(() => {
    if (!txnReceipt) return undefined;
    for (const log of txnReceipt.logs) {
      try {
        const parsedLog = decodeEventLog({
          abi: erc20Abi,
          data: log.data,
          topics: log.topics,
        });
        if (parsedLog.eventName === 'Transfer') {
          return Number(formatUnits(parsedLog.args.value, 6));
        }
      } catch {
        continue;
      }
    }
  }, [txnReceipt]);

  return (
    <DepositStatus
      amount={{
        value: amount,
        isLoading,
      }}
      isSuccess={txnReceipt?.status === 'success'}
      isError={txnReceipt?.status === 'reverted'}
      method={OnrampMethods.WALLET}
      address={address}
    />
  );
};
