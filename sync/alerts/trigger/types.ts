import { Address } from 'viem';

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
