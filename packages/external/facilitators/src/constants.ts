import type { Token } from './types';

const USDC_DECIMALS = 6;
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const USDC_POLYGON = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // USDC on Polygon
const USDC_OPTIMISM = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'; // USDC on Optimism
const USDC_ETHEREUM = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC on Ethereum
const USDC_UNICHAIN = '0x078d782b760474a361dda0af3839290b0ef57ad6'; // USDC on Unichain
const USDC_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // USDC on Arbitrum

export const USDC_BASE_TOKEN: Token = {
  address: USDC_BASE,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
};

export const USDC_SOLANA_TOKEN: Token = {
  address: USDC_SOLANA,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
};

export const USDC_POLYGON_TOKEN: Token = {
  address: USDC_POLYGON,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
};

export const USDC_OPTIMISM_TOKEN: Token = {
  address: USDC_OPTIMISM,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
};

export const USDC_ARBITRUM_TOKEN: Token = {
  address: USDC_ARBITRUM,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
};

export const USDC_ETHEREUM_TOKEN: Token = {
  address: USDC_ETHEREUM,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
};

export const USDC_UNICHAIN_TOKEN: Token = {
  address: USDC_UNICHAIN,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
};