import { SiweMessage } from '@signinwithethereum/siwe';
import { SIWE_STATEMENT } from './constants';

interface CreateSiweMessageOptions {
  domain: string;
  uri: string;
  address: string;
  chainId: number;
  nonce: string;
  now?: Date;
}

export function createSiweMessage({
  domain,
  uri,
  address,
  chainId,
  nonce,
  now = new Date(),
}: CreateSiweMessageOptions) {
  return new SiweMessage({
    domain,
    uri,
    version: '1',
    address,
    statement: SIWE_STATEMENT,
    nonce,
    chainId,
    issuedAt: now.toISOString(),
    expirationTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
  });
}
