import z from 'zod';

import { ok } from '@x402scan/neverthrow';
import {
  fsErr,
  safeChmod,
  safeFileExists,
  safeReadFile,
  safeWriteFile,
} from '@/shared/neverthrow/fs';

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { log } from './log';
import { configFile } from './fs';

import { getAddress } from 'viem';

import { isParseError, safeParse } from './neverthrow/parse';

import type { Hex } from 'viem';

const WALLET_FILE = configFile('wallet.json', '');

const storedWalletSchema = z.object({
  privateKey: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Ethereum private key')
    .transform(privateKey => privateKey as Hex),
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .transform(address => getAddress(address)),
  createdAt: z.string(),
});

const walletSurface = 'wallet';

export async function getWallet() {
  if (process.env.X402_PRIVATE_KEY) {
    const account = privateKeyToAccount(process.env.X402_PRIVATE_KEY as Hex);
    log.info(`Using wallet from env: ${account.address}`);
    return ok({ account, isNew: false });
  }

  const readFileResult = await safeReadFile(walletSurface, WALLET_FILE).andThen(
    data => {
      const parseResult = safeParse(walletSurface, storedWalletSchema, data);
      if (parseResult.isErr()) {
        return parseResult;
      }
      const account = privateKeyToAccount(parseResult.value.privateKey);
      log.info(`Loaded wallet: ${account.address}`);
      return ok({ account, isNew: false });
    }
  );

  if (readFileResult.isOk()) {
    return readFileResult;
  }

  // this happens when the file is found but the data is invalid
  if (isParseError(readFileResult.error)) {
    log.error(`Invalid wallet data: ${readFileResult.error.error.message}`);
    return readFileResult;
  }

  const checkFileExistsResult = await safeFileExists(
    walletSurface,
    WALLET_FILE
  );

  // this happens when the file cant be read but it does exist
  if (checkFileExistsResult.isOk()) {
    return fsErr(walletSurface, {
      cause: 'file_not_readable',
      message: 'The file exists but is not readable',
    });
  }

  // Generate new
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const stored = {
    privateKey,
    address: account.address,
    createdAt: new Date().toISOString(),
  };

  const saveResult = await safeWriteFile(
    walletSurface,
    WALLET_FILE,
    JSON.stringify(stored, null, 2)
  ).andThen(() => safeChmod(walletSurface, WALLET_FILE, 0o600));

  if (saveResult.isErr()) {
    return saveResult;
  }

  log.info(`Created wallet: ${account.address}`);
  log.info(`Saved to: ${WALLET_FILE}`);

  return ok({ account, isNew: true });
}
