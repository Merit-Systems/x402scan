import type { Address, Chain } from 'viem';

export enum Currency {
  USDC = 'USDC',
  ETH = 'ETH',
}

export type BalanceCheckResult = {
  address: Address;
  balance: string;
  isLow: boolean;
  threshold: number;
  currency: Currency;
};

export type DiscordWebhookConfig = {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
};

export type AddressConfig = {
  address: Address;
  chain: Chain;
  currency: Currency;
  threshold: number;
  enabled: boolean;
};
