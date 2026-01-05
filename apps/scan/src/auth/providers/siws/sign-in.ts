import { signIn } from 'next-auth/react';
import { getBase58Decoder, getUtf8Encoder } from '@solana/kit';

import { SIWS_PROVIDER_ID, SIWS_STATEMENT } from './constants';

import type { useSignMessage } from '@solana/react';

type SignInWithSolanaOptions = {
  address: string;
  signMessage: ReturnType<typeof useSignMessage>;
  email?: string;
  redirectTo?: string;
};

export async function signInWithSolana({
  address,
  signMessage,
  email,
  redirectTo,
}: SignInWithSolanaOptions) {
  const result = await signMessage({
    message: new Uint8Array(getUtf8Encoder().encode(SIWS_STATEMENT)),
  });

  const signatureString = getBase58Decoder().decode(result.signature);

  await signIn(SIWS_PROVIDER_ID, {
    message: SIWS_STATEMENT,
    signedMessage: getBase58Decoder().decode(result.signedMessage),
    signature: signatureString,
    address,
    ...(email ? { email } : {}),
    ...(redirectTo ? { redirectTo } : {}),
  });
}
