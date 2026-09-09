/**
 * x402 v2 Payment-enabled fetch wrapper
 *
 * Simplified wrapper using the official @x402 library.
 * Handles both v1 and v2 protocols automatically.
 */
import type { Account } from "viem";
import type { x402Client as X402Client } from "@x402/core/client";
import type { ClientEvmSigner } from "@x402/evm";
import type { ClientSvmSigner } from "@x402/svm";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactSvmScheme } from "@x402/svm/exact/client";
import { ExactSvmSchemeV1 } from "@x402/svm/exact/v1/client";

export { x402Client, wrapFetchWithPayment };
export { registerExactEvmScheme };
/** The EIP-712 payload @x402 clients hand to a signer. */
type TypedDataPayload = Parameters<ClientEvmSigner["signTypedData"]>[0];

/**
 * NOTE(shafu): main difference is that WalletClient has `account.address`
 * while ClientEvmSigner expects `address` directly.
 */
export function toEvmSigner(walletClient: {
  account: Account;
  signTypedData: (
    args: TypedDataPayload & { account: Account }
  ) => Promise<`0x${string}`>;
}): ClientEvmSigner {
  return {
    address: walletClient.account.address,
    signTypedData: (message: TypedDataPayload): Promise<`0x${string}`> => {
      return walletClient.signTypedData({
        account: walletClient.account,
        domain: message.domain,
        types: message.types,
        primaryType: message.primaryType,
        message: message.message,
      });
    },
  };
}

export function registerSvmX402Client(params: {
  signer: ClientSvmSigner;
  rpcUrl: string;
}): X402Client {
  const { signer, rpcUrl } = params;
  const client = new x402Client();

  // v2
  client.register("solana:*", new ExactSvmScheme(signer, { rpcUrl }));

  // v1
  client.registerV1("solana", new ExactSvmSchemeV1(signer, { rpcUrl }));
  client.registerV1("solana-devnet", new ExactSvmSchemeV1(signer, { rpcUrl }));
  client.registerV1("solana-testnet", new ExactSvmSchemeV1(signer, { rpcUrl }));

  return client;
}
