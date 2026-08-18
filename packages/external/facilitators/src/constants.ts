import type { Token } from './types';

const USDC_DECIMALS = 6;
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const USDC_POLYGON = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // USDC on Polygon
const USDC_CELO = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C'; // USDC on Celo
const USDT_CELO = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e'; // USDT on Celo

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

export const USDC_CELO_TOKEN: Token = {
  address: USDC_CELO,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
};

export const USDT_CELO_TOKEN: Token = {
  address: USDT_CELO,
  decimals: 6,
  symbol: 'USDT',
};
