import { SiweMessage } from '@signinwithethereum/siwe';
import { SIWE_PROVIDER_ID, SIWE_STATEMENT } from './constants';
import { getCsrfToken, signIn, type SignInOptions } from 'next-auth/react';

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
  // Build options in statements: the sign-in body is form-encoded, so keys
  // must be present only when they have a value.
  const options: SignInOptions = {
    message: JSON.stringify(message),
    signedMessage: await signMessage(message.prepareMessage()),
  };
  if (email) options.email = email;
  if (redirectTo) options.redirectTo = redirectTo;

  await signIn(SIWE_PROVIDER_ID, options);
}
