import { svmServerWallet } from './svm';
import { evmServerWallet } from './evm';

import { Chain } from '@/types/chain';

import type { EvmWallets, Wallets } from './types';

const evmWallets = (name: string): EvmWallets => ({
  [Chain.BASE]: evmServerWallet(Chain.BASE)(name),
});

export const wallets = (name: string): Wallets => ({
  [Chain.SOLANA]: svmServerWallet(name),
  ...evmWallets(name),
});
