import { env } from '@/env';
import { wallets } from './wallets';

const INVITE_WALLET_NAME = env.INVITE_WALLET_NAME ?? 'x402scan-invite-wallet';

export const inviteWallets = wallets(INVITE_WALLET_NAME);
