/**
 * x402 v2 Payment-enabled fetch wrapper
 *
 * Simplified wrapper using the official @x402 library.
 * Handles both v1 and v2 protocols automatically.
 */
export {
  x402Client,
  wrapFetchWithPayment,
  x402HTTPClient,
} from '@x402/fetch';

export {
  registerExactEvmScheme,
  type EvmClientConfig,
} from '@x402/evm/exact/client';

export {
  registerExactSvmScheme,
  type SvmClientConfig,
} from '@x402/svm/exact/client';

/**
 * Adapts a wagmi WalletClient to the ClientEvmSigner interface
 * expected by @x402/evm.
 *
 * The main difference is that WalletClient has `account.address`
 * while ClientEvmSigner expects `address` directly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toEvmSigner(walletClient: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    address: walletClient.account.address as `0x${string}`,
    signTypedData: async (message: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    }): Promise<`0x${string}`> => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return walletClient.signTypedData({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        account: walletClient.account,
        domain: message.domain,
        types: message.types,
        primaryType: message.primaryType,
        message: message.message,
      }) as Promise<`0x${string}`>;
    },
  };
}
