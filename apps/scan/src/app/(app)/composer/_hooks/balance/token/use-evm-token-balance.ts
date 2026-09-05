import { useAccount, useReadContract } from "wagmi";

import { useQueryClient } from "@tanstack/react-query";

import { CHAIN_ID } from "@/types/chain";
import { ethereumAddressSchema } from "@/lib/schemas";

import type { Token } from "@/types/token";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import type { UseBalanceReturnType } from "../types";

interface Props {
  token: Token;
  address?: Address;
  query?: {
    enabled?: boolean;
    refetchOnMount?: boolean | "always";
  };
}

export const useEvmTokenBalance = (props: Props): UseBalanceReturnType => {
  const queryClient = useQueryClient();

  const { token, address: addressOverride, query } = props;

  const { address } = useAccount();

  const addressToQuery = addressOverride ?? address ?? undefined;
  const tokenAddress = ethereumAddressSchema.safeParse(token.address);

  const result = useReadContract({
    abi: erc20Abi,
    address: tokenAddress.success ? tokenAddress.data : undefined,
    args: addressToQuery ? [addressToQuery] : undefined,
    chainId: CHAIN_ID[token.chain],
    functionName: "balanceOf",
    query: {
      ...query,
      enabled:
        query?.enabled !== false &&
        Boolean(addressToQuery) &&
        tokenAddress.success,
    },
  });

  return {
    ...result,
    data:
      result.data === undefined
        ? undefined
        : Number(result.data) / 10 ** token.decimals,
    invalidate: () => {
      void queryClient.invalidateQueries({ queryKey: result.queryKey });
    },
  };
};
