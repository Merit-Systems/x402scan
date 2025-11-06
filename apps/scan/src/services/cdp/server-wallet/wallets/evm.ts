import { getBalance, readContract } from 'viem/actions';

import { cdpClient } from '../client';

import { evmRpc } from '@/services/rpc/evm';

import { erc20Abi, formatEther } from 'viem';
import { convertTokenAmount } from '@/lib/token';
import { toAccount } from 'viem/accounts';

import type { EvmChain } from '@/types/chain';
import type { Address } from 'viem';
import type { NetworkServerWallet } from './types';

export const evmServerWallet =
  <T extends EvmChain>(chain: T): NetworkServerWallet<EvmChain> =>
  (name: string) => {
    const getAccount = async () => {
      return await cdpClient.evm.getOrCreateAccount({
        name,
      });
    };

    const getAddress = async () => (await getAccount()).address;

    const rpc = evmRpc[chain];

    return {
      address: getAddress,
      getNativeTokenBalance: async () => {
        const weiBalance = await getBalance(rpc, {
          address: await getAddress(),
        });
        return parseFloat(formatEther(weiBalance));
      },
      getTokenBalance: async ({ token }) => {
        const balance = await readContract(rpc, {
          abi: erc20Abi,
          address: token.address as Address,
          args: [await getAddress()],
          functionName: 'balanceOf',
        });
        return convertTokenAmount(balance);
      },
      export: async () => {
        return cdpClient.evm.exportAccount({
          address: await getAddress(),
          name,
        });
      },
      signer: async () => toAccount(await getAccount()),
      sendTokens: async () => {
        return 'Not implemented';
      },
    };
  };
