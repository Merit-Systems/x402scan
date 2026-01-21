import { getBalance, readContract } from 'wagmi/actions';
import { toAccount } from 'viem/accounts';

import { cdpClient } from '../client';

import { encodeFunctionData, erc20Abi, formatEther, parseUnits } from 'viem';
import { convertTokenAmount } from '@/lib/token';

import { cdpResultFromPromise } from '../../result';

import { createWagmiConfig } from '@/app/_contexts/wagmi/config';

import type { EvmChain } from '@/types/chain';
import type { Address } from 'viem';
import type { NetworkServerWallet } from './types';

export const evmServerWallet =
  <T extends EvmChain>(chain: T): NetworkServerWallet<EvmChain> =>
  (name: string) => {
    const getAccount = async () => {
      return await cdpClient.evm.getOrCreateAccount({ name });
    };

    const getAddress = async () => (await getAccount()).address;

    const wagmiConfig = createWagmiConfig();

    return {
      address: () =>
        cdpResultFromPromise(getAddress(), error => ({
          type: 'internal',
          message: 'Failed to get wallet address',
          error,
        })),
      getNativeTokenBalance: () =>
        cdpResultFromPromise(
          getAddress()
            .then(address =>
              getBalance(wagmiConfig, {
                address,
              })
            )
            .then(result => parseFloat(formatEther(result.value))),
          error => ({
            type: 'internal',
            message: 'Failed to get native token balance',
            error,
          })
        ),
      getTokenBalance: ({ token }) =>
        cdpResultFromPromise(
          getAddress()
            .then(address =>
              readContract(wagmiConfig, {
                abi: erc20Abi,
                address: token.address as Address,
                args: [address],
                functionName: 'balanceOf',
              })
            )
            .then(balance => convertTokenAmount(balance)),
          error => ({
            type: 'internal',
            message: 'Failed to get token balance',
            error,
          })
        ),
      export: () =>
        cdpResultFromPromise(
          getAddress().then(address =>
            cdpClient.evm.exportAccount({
              address,
              name,
            })
          ),
          error => ({
            type: 'internal',
            message: 'Failed to export wallet',
            error,
          })
        ),
      signer: async () => toAccount(await getAccount()),
      sendTokens: ({ address, token, amount }) =>
        cdpResultFromPromise(
          getAccount().then(account =>
            account
              .sendTransaction({
                network: chain,
                transaction: {
                  to: token.address as Address,
                  data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [
                      address as Address,
                      parseUnits(amount.toString(), token.decimals),
                    ],
                  }),
                },
              })
              .then(({ transactionHash }) => transactionHash)
          ),
          error => ({
            type: 'internal',
            message: 'Failed to send tokens',
            error,
          })
        ),
    };
  };
