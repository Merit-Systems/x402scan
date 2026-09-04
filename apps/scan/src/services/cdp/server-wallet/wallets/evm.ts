import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { readContract } from "viem/actions";
import { toAccount } from "viem/accounts";

import { cdpClient } from "../client";

import { baseRpc } from "@/services/rpc/base";

import { cdpResultFromPromise } from "../../result";

import { convertTokenAmount } from "@/lib/token";
import { ethereumAddressSchema } from "@/lib/schemas";

import type { EvmChain } from "@/types/chain";
import type { NetworkServerWallet } from "./types";

export const evmServerWallet =
  (chain: EvmChain): NetworkServerWallet<EvmChain> =>
  (name: string) => {
    const getAccount = async () => {
      return cdpClient.evm.getOrCreateAccount({ name });
    };

    const getAddress = async () => (await getAccount()).address;

    return {
      address: () =>
        cdpResultFromPromise("getAddress", getAddress(), (e) => ({
          cause: "bad_gateway",
          message:
            e instanceof Error ? e.message : "Failed to get wallet address",
        })),
      getTokenBalance: ({ token }) =>
        cdpResultFromPromise(
          "getTokenBalance",
          getAddress()
            .then((address) =>
              readContract(baseRpc, {
                abi: erc20Abi,
                address: ethereumAddressSchema.parse(token.address),
                args: [address],
                functionName: "balanceOf",
              })
            )
            .then((balance) => convertTokenAmount(balance)),
          (e) => ({
            cause: "bad_gateway",
            message:
              e instanceof Error ? e.message : "Failed to get token balance",
          })
        ),
      export: () =>
        cdpResultFromPromise(
          "export",
          getAddress().then((address) =>
            cdpClient.evm.exportAccount({
              address,
              name,
            })
          ),
          (e) => ({
            cause: "bad_gateway",
            message: e instanceof Error ? e.message : "Failed to export wallet",
          })
        ),
      signer: async () => toAccount(await getAccount()),
      sendTokens: ({ address, token, amount }) =>
        cdpResultFromPromise(
          "sendTokens",
          getAccount().then((account) =>
            account
              .sendTransaction({
                network: chain,
                transaction: {
                  to: ethereumAddressSchema.parse(token.address),
                  data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [
                      ethereumAddressSchema.parse(address),
                      parseUnits(amount.toString(), token.decimals),
                    ],
                  }),
                },
              })
              .then(({ transactionHash }) => transactionHash)
          ),
          (e) => ({
            cause: "bad_gateway",
            message: e instanceof Error ? e.message : "Failed to send tokens",
          })
        ),
    };
  };
