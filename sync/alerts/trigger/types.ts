import { Address, Chain } from 'viem';

export enum Currency {
  USDC = 'USDC',
  ETH = 'ETH',
}

export interface BalanceCheckResult {
  address: Address;
  balance: string;
  isLow: boolean;
  threshold: number;
  currency: Currency;
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
