import { SIWS_PROVIDER_ID } from './constants';
import { getCsrfToken, signIn } from 'next-auth/react';
import { useSignMessage } from '@solana/react';
import {
  getBase58Decoder,
  getPublicKeyFromAddress,
  getUtf8Encoder,
  signature,
  verifySignature,
  address as toAddress,
  signatureBytes as toSignatureBytes,
  isSignature,
  isSignatureBytes,
  getBase58Encoder,
  getBase64Encoder,
  getBase64Decoder,
} from '@solana/kit';

import type { SolanaSignInInput } from '@solana/wallet-standard-features';

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
  const message = await createSignInData(address);
  const result = await signMessage({
    message: new Uint8Array(getUtf8Encoder().encode(JSON.stringify(message))),
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
    message: JSON.stringify(message),
    signedMessage: getBase58Decoder().decode(result.signedMessage),
    signature: signatureString,
    address,
    ...(email ? { email } : {}),
    ...(redirectTo ? { redirectTo } : {}),
  });
}

const createSignInData = async (
  address: string
): Promise<SolanaSignInInput> => {
  const now: Date = new Date();
  const uri = window.location.href;
  const currentUrl = new URL(uri);
  const domain = currentUrl.host;

  const currentDateTime = now.toISOString();

  const signInData: SolanaSignInInput = {
    domain,
    address,
    statement:
      'Clicking Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee.',
    version: '1',
    nonce: await getCsrfToken(),
    chainId: 'mainnet',
    issuedAt: currentDateTime,
  };

  return signInData;
};
