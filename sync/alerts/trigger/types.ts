import { Address, Chain } from 'viem';

export enum Currency {
  USDC = 'USDC',
  ETH = 'ETH',
}

export interface BalanceCheckResult {
  address: Address;
  balance: string; // in USDC (human readable)
  isLow: boolean;
  threshold: number;
}

export interface DiscordWebhookConfig {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

export interface AddressConfig {
  address: Address;
  chain: Chain;
  currency: Currency;
  threshold: number;
}
