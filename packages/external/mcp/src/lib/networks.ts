/**
 * Chain configurations - CAIP-2 identifiers, USDC addresses, viem chains
 */

import {
  base,
  baseSepolia,
  mainnet,
  sepolia,
  optimism,
  arbitrum,
  polygon,
} from 'viem/chains';

import type { Chain } from 'viem';

export interface ChainConfig {
  chain: Chain;
  caip2: string;
  v1Name: string;
  usdcAddress: `0x${string}`;
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'eip155:8453': {
    chain: base,
    caip2: 'eip155:8453',
    v1Name: 'base',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  'eip155:84532': {
    chain: baseSepolia,
    caip2: 'eip155:84532',
    v1Name: 'base-sepolia',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  'eip155:1': {
    chain: mainnet,
    caip2: 'eip155:1',
    v1Name: 'ethereum',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  'eip155:11155111': {
    chain: sepolia,
    caip2: 'eip155:11155111',
    v1Name: 'ethereum-sepolia',
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
  'eip155:10': {
    chain: optimism,
    caip2: 'eip155:10',
    v1Name: 'optimism',
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  },
  'eip155:42161': {
    chain: arbitrum,
    caip2: 'eip155:42161',
    v1Name: 'arbitrum',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  'eip155:137': {
    chain: polygon,
    caip2: 'eip155:137',
    v1Name: 'polygon',
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  },
};

const V1_TO_CAIP2: Record<string, string> = {
  base: 'eip155:8453',
  'base-sepolia': 'eip155:84532',
  ethereum: 'eip155:1',
  'ethereum-sepolia': 'eip155:11155111',
  optimism: 'eip155:10',
  arbitrum: 'eip155:42161',
  polygon: 'eip155:137',
};

export const DEFAULT_NETWORK = 'eip155:8453';

/** Convert any network identifier to CAIP-2 format */
export function toCaip2(network: string): string {
  if (network.startsWith('eip155:')) return network;
  return V1_TO_CAIP2[network.toLowerCase()] ?? network;
}

/** Get chain config from network identifier */
export function getChainConfig(network: string): ChainConfig | undefined {
  return CHAIN_CONFIGS[toCaip2(network)];
}

/** Get USDC address for a network */
export function getUSDCAddress(network: string): `0x${string}` | undefined {
  return getChainConfig(network)?.usdcAddress;
}

/** Get viem Chain object for a network */
export function getChain(network: string): Chain | undefined {
  return getChainConfig(network)?.chain;
}

/** Extract chain ID from CAIP-2 identifier */
export function getChainId(network: string): number | undefined {
  const caip2 = toCaip2(network);
  const match = /^eip155:(\d+)$/.exec(caip2);
  return match ? parseInt(match[1]!, 10) : undefined;
}

/** Get human-readable chain name */
export function getChainName(network: string): string {
  return getChainConfig(network)?.chain.name ?? network;
}

/** Get block explorer URL for a network */
export function getExplorerUrl(network: string): string | undefined {
  return getChainConfig(network)?.chain.blockExplorers?.default.url;
}

/** Check if network is a testnet */
export function isTestnet(network: string): boolean {
  return getChainConfig(network)?.chain.testnet === true;
}
