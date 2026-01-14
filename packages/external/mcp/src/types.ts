import type { PrivateKeyAccount } from 'viem';

interface GlobalFlags {
  dev: boolean;
}

export type Command<Flags extends object = object> = (
  account: PrivateKeyAccount,
  flags: GlobalFlags & Flags
) => Promise<void>;
