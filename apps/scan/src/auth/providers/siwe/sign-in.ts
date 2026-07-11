import { SIWE_PROVIDER_ID } from './constants';
import { createSiweMessage } from './message';
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
  const message = createSiweMessage({
    domain: window.location.host,
    uri: window.location.origin,
    address,
    nonce: await getCsrfToken(),
    chainId,
  });
  await signIn(SIWE_PROVIDER_ID, {
    message: JSON.stringify(message),
    signedMessage: await signMessage(message.prepareMessage()),
    ...(email ? { email } : {}),
    ...(redirectTo ? { redirectTo } : {}),
  });
}
