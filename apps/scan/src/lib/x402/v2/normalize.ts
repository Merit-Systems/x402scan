import { ChainIdToNetwork } from 'x402/types';

export function normalizeChainId(chainId: string): string {
  if (chainId.startsWith('eip155:')) {
    const id = Number(chainId.split(':')[1]);
    const network = ChainIdToNetwork[id];
    return network ?? chainId; // Fall back to original if unknown
  }
  return chainId; // Already a named network like 'solana'
}
