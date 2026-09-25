import { optionalSupportedChainSchema } from "@/lib/schemas";

export const parseChain = (chain: string | string[] | null | undefined) => {
  const result = optionalSupportedChainSchema.safeParse(chain);
  if (!result.success) {
    return undefined;
  }
  return result.data;
};
