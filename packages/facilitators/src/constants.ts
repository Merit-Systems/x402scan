import type { Token } from './types';

const USDC_DECIMALS = 6;
const DECIMALS_ON_BNB = 18;
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const USDC_POLYGON = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // USDC on Polygon
const USDT_BNB = '0x55d398326f99059fF775485246999027B3197955'; // USDT on BNB
const USD1_BNB = '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d'; // USD1 on BNB
const USDC_BNB = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'; // USDC on BNB

export const USDT_BNB_TOKEN: Token = {
  address: USDT_BNB,
  decimals: DECIMALS_ON_BNB,
  symbol: 'USDT',
};

export const USDC_BNB_TOKEN: Token = {
  address: USD1_BNB,
  decimals: DECIMALS_ON_BNB,
  symbol: 'USD1',
};

export const USDC_BNB_TOKEN: Token = {
  address: USDC_BNB,
  decimals: DECIMALS_ON_BNB,
  symbol: 'USDC',
};

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
