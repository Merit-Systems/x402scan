import { supportedChainSchema } from '@/lib/schemas';

export const getChain = (chain: unknown) => {
  const result = supportedChainSchema.safeParse(chain);
  if (!result.success) {
    return undefined;
  }
  return result.data;
};
