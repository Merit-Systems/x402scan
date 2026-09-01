import { signIn, type SignInOptions } from "next-auth/react";
import { getBase58Decoder, getUtf8Encoder } from "@solana/kit";

import { SIWS_PROVIDER_ID, SIWS_STATEMENT } from "./constants";

import type { useSignMessage } from "@solana/react";

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
  const result = await signMessage({
    message: new Uint8Array(getUtf8Encoder().encode(SIWS_STATEMENT)),
  });

  const signatureString = getBase58Decoder().decode(result.signature);

  // Build options in statements: the sign-in body is form-encoded, so keys
  // must be present only when they have a value.
  const options: SignInOptions = {
    message: SIWS_STATEMENT,
    signedMessage: getBase58Decoder().decode(result.signedMessage),
    signature: signatureString,
    address,
  };
  if (email) options.email = email;
  if (redirectTo) options.redirectTo = redirectTo;

  await signIn(SIWS_PROVIDER_ID, options);
}
