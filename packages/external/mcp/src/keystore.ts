/**
 * Keystore - private key management
 *
 * Stores wallet at ~/.x402scan-mcp/wallet.json
 * Can be overridden via X402_PRIVATE_KEY env var
 */

import z from 'zod';

import { randomBytes } from 'crypto';
import * as fs from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

import { privateKeyToAccount } from 'viem/accounts';

import { log } from './lib/log';
import { ethereumAddressSchema, ethereumPrivateKeySchema } from './lib/schemas';
import { Hex } from 'viem';

const KEYSTORE_DIR = join(homedir(), '.x402scan-mcp');
const KEYSTORE_FILE = join(KEYSTORE_DIR, 'wallet.json');

const storedWalletSchema = z.object({
  privateKey: ethereumPrivateKeySchema,
  address: ethereumAddressSchema,
  createdAt: z.string(),
});

export async function getWallet() {
  // Environment override
  if (process.env.X402_PRIVATE_KEY) {
    const account = privateKeyToAccount(process.env.X402_PRIVATE_KEY as Hex);
    log.info(`Using wallet from env: ${account.address}`);
    return account;
  }

  // Try loading existing
  try {
    const data = await fs.readFile(KEYSTORE_FILE, 'utf-8');
    const stored = storedWalletSchema.parse(JSON.parse(data));
    const account = privateKeyToAccount(stored.privateKey);
    log.info(`Loaded wallet: ${account.address}`);
    return account;
  } catch {
    // File doesn't exist or is invalid, generate new wallet
  }

  // Generate new
  const privateKey = `0x${randomBytes(32).toString('hex')}` as const;
  const account = privateKeyToAccount(privateKey);
  const stored = {
    privateKey,
    address: account.address,
    createdAt: new Date().toISOString(),
  };

  await fs.mkdir(KEYSTORE_DIR, { recursive: true });
  await fs.writeFile(KEYSTORE_FILE, JSON.stringify(stored, null, 2));
  try {
    await fs.chmod(KEYSTORE_FILE, 0o600);
  } catch {}

  log.info(`Created wallet: ${account.address}`);
  log.info(`Saved to: ${KEYSTORE_FILE}`);
  return account;
}
