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
} from '@solana/kit';

import type { SolanaSignInInput } from '@solana/wallet-standard-features';

interface SignInWithSolanaOptions {
  address: string;
  signMessage: ReturnType<typeof useSignMessage>;
  email?: string;
  redirectTo?: string;
}

export async function signInWithSolana({
  address,
  signMessage,
  email,
  redirectTo,
}: SignInWithSolanaOptions) {
  const message = await createSignInData(address);
  const result = await signMessage({
    message: new Uint8Array(getUtf8Encoder().encode(JSON.stringify(message))),
  });

  // Wallet returns 66 bytes with a 2-byte signature type prefix
  // Trim to 64 bytes to get the raw Ed25519 signature
  let signatureBytes = result.signature;
  console.log(signatureBytes.length);
  if (signatureBytes.length === 66) {
    signatureBytes = signatureBytes.slice(2);
  }

  console.log(isSignatureBytes(signatureBytes));

  // Convert to base58 strings for transmission
  const signatureString = getBase58Decoder().decode(signatureBytes);
  const signedMessageString = getBase58Decoder().decode(result.signedMessage);

  console.log(
    await verifySignature(
      await getPublicKeyFromAddress(toAddress(address)),
      toSignatureBytes(signatureBytes),
      result.signedMessage
    )
  );

  // await signIn(SIWS_PROVIDER_ID, {
  //   message: JSON.stringify(message),
  //   signedMessage: signedMessageString,
  //   signature: signatureString,
  //   address,
  //   ...(email ? { email } : {}),
  //   ...(redirectTo ? { redirectTo } : {}),
  // });
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
