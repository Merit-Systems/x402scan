import z from 'zod';

import type { Hex } from 'viem';
import { getAddress } from 'viem';

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
  .transform(address => getAddress(address));

export const ethereumPrivateKeySchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Ethereum private key')
  .transform(privateKey => privateKey as Hex);
