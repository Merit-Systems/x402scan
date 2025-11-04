import { SiweMessage } from 'siwe';
import { SIWE_PROVIDER_ID, SIWE_STATEMENT } from './constants';
import { getCsrfToken, signIn } from 'next-auth/react';

interface SignInWithEthereumOptions {
  address: string;
  chainId: number;
  signMessage: (message: string) => Promise<string>;
  email?: string;
  redirectTo?: string;
}

export async function signInWithEthereum({
  address,
  chainId,
  signMessage,
  email,
  redirectTo,
}: SignInWithEthereumOptions) {
  const message = new SiweMessage({
    domain: window.location.host,
    uri: window.location.origin,
    version: '1',
    address,
    statement: SIWE_STATEMENT,
    nonce: await getCsrfToken(),
    chainId,
    expirationTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  });
  await signIn(SIWE_PROVIDER_ID, {
    message: JSON.stringify(message),
    signedMessage: await signMessage(message.prepareMessage()),
    ...(email ? { email } : {}),
    ...(redirectTo ? { redirectTo } : {}),
  });
}
