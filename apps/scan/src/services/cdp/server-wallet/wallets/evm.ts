import { getBalance, readContract } from 'wagmi/actions';

import { cdpClient } from '../client';

import { encodeFunctionData, erc20Abi, formatEther, parseUnits } from 'viem';
import { convertTokenAmount } from '@/lib/token';
import { toAccount } from 'viem/accounts';

import type { EvmChain } from '@/types/chain';
import type { Address } from 'viem';
import type { NetworkServerWallet } from './types';
import { createWagmiConfig } from '@/app/_contexts/wagmi/config';

export const evmServerWallet =
  <T extends EvmChain>(chain: T): NetworkServerWallet<EvmChain> =>
  (name: string) => {
    const getAccount = async () => {
      return await cdpClient.evm.getOrCreateAccount({
        name,
      });
    };

    const getAddress = async () => (await getAccount()).address;

    const wagmiConfig = createWagmiConfig();

    return {
      address: getAddress,
      getNativeTokenBalance: async () => {
        const weiBalance = await getBalance(wagmiConfig, {
          address: await getAddress(),
        });
        return parseFloat(formatEther(weiBalance.value));
      },
      getTokenBalance: async ({ token }) => {
        const balance = await readContract(wagmiConfig, {
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
      sendTokens: async ({ address, token, amount }) => {
        const account = await getAccount();
        const { transactionHash } = await account.sendTransaction({
          network: chain,
          transaction: {
            to: token.address as Address,
            value: 0n,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [
                address as Address,
                parseUnits(amount.toString(), token.decimals),
              ],
            }),
          },
        });
        return transactionHash;
      },
    };
  };
