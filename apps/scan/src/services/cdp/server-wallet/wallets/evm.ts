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
        cdpResultFromPromise('getAddress', getAddress(), e => ({
          cause: 'bad_gateway',
          message:
            e instanceof Error ? e.message : 'Failed to get wallet address',
        })),
      getNativeTokenBalance: () =>
        cdpResultFromPromise(
          'getNativeTokenBalance',
          getAddress()
            .then(address =>
              getBalance(wagmiConfig, {
                address,
              })
            )
            .then(result => parseFloat(formatEther(result.value))),
          e => ({
            cause: 'bad_gateway',
            message:
              e instanceof Error
                ? e.message
                : 'Failed to get native token balance',
          })
        ),
      getTokenBalance: ({ token }) =>
        cdpResultFromPromise(
          'getTokenBalance',
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
          e => ({
            cause: 'bad_gateway',
            message:
              e instanceof Error ? e.message : 'Failed to get token balance',
          })
        ),
      export: () =>
        cdpResultFromPromise(
          'export',
          getAddress().then(address =>
            cdpClient.evm.exportAccount({
              address,
              name,
            })
          ),
          e => ({
            cause: 'bad_gateway',
            message: e instanceof Error ? e.message : 'Failed to export wallet',
          })
        ),
      signer: async () => toAccount(await getAccount()),
      sendTokens: ({ address, token, amount }) =>
        cdpResultFromPromise(
          'sendTokens',
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
          e => ({
            cause: 'bad_gateway',
            message: e instanceof Error ? e.message : 'Failed to send tokens',
          })
        ),
    };
  };
