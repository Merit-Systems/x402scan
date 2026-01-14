import type { PrivateKeyAccount } from 'viem';

export type Command = (account: PrivateKeyAccount) => Promise<void>;
