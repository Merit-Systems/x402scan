import z from 'zod';

import { err, ok } from '@x402scan/neverthrow';
import {
  safeChmod,
  safeReadFile,
  safeWriteFile,
} from '@x402scan/neverthrow/fs';

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { log } from './log';
import {
  ethereumAddressSchema,
  ethereumPrivateKeySchema,
} from '../server/lib/schemas';
import { configFile } from './fs';

import type { Hex } from 'viem';

const WALLET_FILE = configFile('wallet.json', '');

const storedWalletSchema = z.object({
  privateKey: ethereumPrivateKeySchema,
  address: ethereumAddressSchema,
  createdAt: z.string(),
});

const walletSurface = 'wallet';

export async function getWallet() {
  if (process.env.X402_PRIVATE_KEY) {
    const account = privateKeyToAccount(process.env.X402_PRIVATE_KEY as Hex);
    log.info(`Using wallet from env: ${account.address}`);
    return ok(walletSurface)({ account, isNew: false });
  }

  const readFileResult = await safeReadFile(walletSurface)(WALLET_FILE).andThen(
    data => {
      const stored = storedWalletSchema.safeParse(JSON.parse(data));
      if (!stored.success) {
        return err(walletSurface)({
          type: 'invalid_data',
          message: 'Invalid wallet data',
          error: stored.error,
        });
      }
      const account = privateKeyToAccount(stored.data.privateKey);
      log.info(`Loaded wallet: ${account.address}`);
      return ok(walletSurface)({ account, isNew: false });
    }
  );

  if (readFileResult.isOk()) {
    return readFileResult;
  }

  // Generate new
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const stored = {
    privateKey,
    address: account.address,
    createdAt: new Date().toISOString(),
  };

  safeWriteFile(walletSurface)(WALLET_FILE, JSON.stringify(stored, null, 2));
  safeChmod(walletSurface)(WALLET_FILE, 0o600);

  log.info(`Created wallet: ${account.address}`);
  log.info(`Saved to: ${WALLET_FILE}`);

  return ok(walletSurface)({ account, isNew: true });
}
