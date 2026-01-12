/**
 * x402 v2 Payment-enabled fetch wrapper
 *
 * Simplified wrapper using the official @x402 library.
 * Handles both v1 and v2 protocols automatically.
 */
export { x402Client, wrapFetchWithPayment, x402HTTPClient } from '@x402/fetch';

export {
  registerExactEvmScheme,
  type EvmClientConfig,
} from '@x402/evm/exact/client';

export {
  registerExactSvmScheme,
  type SvmClientConfig,
} from '@x402/svm/exact/client';

// ClientEvmSigner interface expected by @x402/evm
export interface ClientEvmSigner {
  readonly address: `0x${string}`;
  signTypedData(message: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<`0x${string}`>;
}

/**
 * Adapts a wagmi WalletClient to the ClientEvmSigner interface
 * expected by @x402/evm.
 *
 * The main difference is that WalletClient has `account.address`
 * while ClientEvmSigner expects `address` directly.
 */
export function toEvmSigner(walletClient: {
  account: { address: `0x${string}` };
  signTypedData: (args: unknown) => Promise<`0x${string}`>;
}): ClientEvmSigner {
  return {
    address: walletClient.account.address,
    signTypedData: (message: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    }): Promise<`0x${string}`> => {
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
