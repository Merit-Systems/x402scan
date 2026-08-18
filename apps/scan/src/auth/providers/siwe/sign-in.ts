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

const MESSAGE_LIFETIME_MS = 2 * 60 * 60 * 1000;

interface BuildSiweMessageOptions {
  domain: string;
  uri: string;
  address: string;
  chainId: number;
  nonce: string;
  issuedAt?: Date;
}

/**
 * Build the message the user is asked to sign.
 *
 * Split out from the sign-in flow so the field set stays under test: the
 * SiweMessage object constructor validates eagerly and rejects a message
 * without an `issuedAt` rather than defaulting it, which throws before the
 * wallet is ever prompted.
 */
export function buildSiweMessage({
  domain,
  uri,
  address,
  chainId,
  nonce,
  issuedAt = new Date(),
}: BuildSiweMessageOptions) {
  return new SiweMessage({
    domain,
    uri,
    version: '1',
    address,
    statement: SIWE_STATEMENT,
    nonce,
    chainId,
    issuedAt: issuedAt.toISOString(),
    expirationTime: new Date(
      issuedAt.getTime() + MESSAGE_LIFETIME_MS
    ).toISOString(),
  });
}

export async function signInWithEthereum({
  address,
  chainId,
  signMessage,
  email,
  redirectTo,
}: SignInWithEthereumOptions) {
  const message = buildSiweMessage({
    domain: window.location.host,
    uri: window.location.origin,
    address,
    chainId,
    nonce: await getCsrfToken(),
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
