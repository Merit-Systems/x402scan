import { optionalSupportedChainSchema } from '@/lib/schemas';

export const parseChain = (chain: unknown) => {
  const result = optionalSupportedChainSchema.safeParse(chain);
  if (!result.success) {
    return undefined;
  }
  return result.data;
};
