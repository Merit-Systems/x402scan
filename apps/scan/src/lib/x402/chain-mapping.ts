// Mirrors `ChainIdToNetwork` from the v1 `x402` SDK so the production app
// doesn't depend on a v1 package for what is effectively a static lookup.
// v2 uses CAIP-2 strings natively and ships no equivalent map.

const EvmNetworkToChainId: Record<string, number> = {
  abstract: 2741,
  'abstract-testnet': 11124,
  'base-sepolia': 84532,
  base: 8453,
  'avalanche-fuji': 43113,
  avalanche: 43114,
  iotex: 4689,
  sei: 1329,
  'sei-testnet': 1328,
  polygon: 137,
  'polygon-amoy': 80002,
  peaq: 3338,
  story: 1514,
  educhain: 41923,
  'skale-base-sepolia': 324705682,
};

const SvmNetworkToChainId: Record<string, number> = {
  'solana-devnet': 103,
  solana: 101,
};

export const ChainIdToNetwork: Record<number, string> = Object.fromEntries(
  [
    ...Object.entries(EvmNetworkToChainId),
    ...Object.entries(SvmNetworkToChainId),
  ].map(([network, chainId]) => [chainId, network])
);
