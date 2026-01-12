import { env } from '@/env';
import { wallets } from './wallets';

export const freeTierWallets = wallets(env.FREE_TIER_WALLET_NAME);
