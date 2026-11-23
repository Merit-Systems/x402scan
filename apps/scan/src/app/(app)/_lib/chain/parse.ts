import { listedChainSchema } from '@/lib/schemas';

export const parseChain = (chain: string | string[] | null | undefined) => {
  const result = listedChainSchema.optional().safeParse(chain);
  if (!result.success) {
    return undefined;
  }
  return result.data;
};
