import { getCsrfToken, signIn } from 'next-auth/react';
import {
  getBase58Decoder,
  getUtf8Encoder,
  getBase58Encoder,
  getBase64Decoder,
} from '@solana/kit';

import { SIWS_PROVIDER_ID, SIWS_STATEMENT } from './constants';

import type { useSignMessage } from '@solana/react';

interface SignInWithSolanaOptions {
  address: string;
  signMessage: ReturnType<typeof useSignMessage>;
  isEmbeddedWallet: boolean;
  email?: string;
  redirectTo?: string;
}

export async function signInWithSolana({
  address,
  signMessage,
  email,
  redirectTo,
  isEmbeddedWallet = false,
}: SignInWithSolanaOptions) {
  const result = await signMessage({
    message: new Uint8Array(getUtf8Encoder().encode(SIWS_STATEMENT)),
  });

  let signatureString: string;
  if (isEmbeddedWallet) {
    const signatureStringBase64 = getBase64Decoder().decode(result.signature);
    const signatureBytes = getBase58Encoder().encode(signatureStringBase64);
    signatureString = getBase58Decoder().decode(signatureBytes);
  } else {
    signatureString = getBase58Decoder().decode(result.signature);
  }

  await signIn(SIWS_PROVIDER_ID, {
    message: SIWS_STATEMENT,
    signedMessage: getBase58Decoder().decode(result.signedMessage),
    signature: signatureString,
    address,
    ...(email ? { email } : {}),
    ...(redirectTo ? { redirectTo } : {}),
  });
}
