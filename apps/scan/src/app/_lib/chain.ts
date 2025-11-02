import { optionalChainSchema } from '@/lib/schemas';

export const getChain = (chain: unknown) => {
  const result = optionalChainSchema.safeParse(chain);
  if (!result.success) {
    return undefined;
  }
  return result.data;
};
