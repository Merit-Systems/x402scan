import { env } from '@/env';
import {
  createPaymentHeader,
  selectPaymentRequirements,
  type PaymentRequirementsSelector,
} from 'x402/client';
import {
  ChainIdToNetwork,
  PaymentRequirementsSchema,
  isMultiNetworkSigner,
  isSvmSignerWallet,
  evm,
  type Signer,
  type MultiNetworkSigner,
  type X402Config,
  type Network,
} from 'x402/types';
import { normalizeChainId } from './index';
import type { V2Accept, V2Resource } from './v2';

/**
 * Transform v2 accept to v1 format for compatibility with PaymentRequirementsSchema
 */
function transformV2AcceptToV1(
  accept: V2Accept,
  resource?: V2Resource
): Record<string, unknown> {
  return {
    ...accept,
    network: normalizeChainId(accept.network),
    maxAmountRequired: accept.amount ?? accept.maxAmountRequired,
    resource: accept.resource ?? resource?.url ?? '',
    description: accept.description ?? resource?.description ?? '',
    mimeType: accept.mimeType ?? resource?.mimeType ?? '',
  };
}

/**
 * Parse 402 response to extract payment requirements.
 * v2: from Payment-Required header (base64 encoded)
 * v1: from response body
 */
async function parse402Response(response: Response): Promise<{
  x402Version: number;
  accepts: unknown[];
  resource?: V2Resource;
  extensions?: Record<string, unknown>;
}> {
  const paymentRequiredHeader = response.headers.get('Payment-Required');

  if (paymentRequiredHeader) {
    // v2: decode from base64 header
    try {
      const decoded = atob(paymentRequiredHeader);
      const parsed = JSON.parse(decoded) as {
        x402Version?: number;
        accepts?: unknown[];
        resource?: V2Resource;
        extensions?: Record<string, unknown>;
      };
      return {
        x402Version: parsed.x402Version ?? 2,
        accepts: parsed.accepts ?? [],
        resource: parsed.resource,
        extensions: parsed.extensions,
      };
    } catch (error) {
      console.error(
        '[wrapFetchWithPayment] Failed to parse Payment-Required header:',
        error
      );
      throw new Error('Failed to parse Payment-Required header');
    }
  }

  // v1 or v2 from body
  try {
    const clonedResponse = response.clone();
    const rawText = await clonedResponse.text();

    const body = JSON.parse(rawText) as {
      x402Version?: number;
      accepts?: unknown[];
      resource?: V2Resource;
      extensions?: Record<string, unknown>;
    };
    return {
      x402Version: body.x402Version ?? 1,
      accepts: body.accepts ?? [],
      resource: body.resource,
      extensions: body.extensions,
    };
  } catch (error) {
    console.error(
      '[wrapFetchWithPayment] Failed to parse 402 response body:',
      error
    );
    throw new Error('Failed to parse 402 response body');
  }
}

/**
 * Wraps fetch with x402 payment support for both v1 and v2 protocols.
 *
 * v1: Payment requirements in JSON body with `accepts` array
 * v2: Payment requirements in `Payment-Required` header (base64 encoded)
 */
export const wrapFetchWithPayment = (
  fetch: typeof globalThis.fetch,
  walletClient: Signer | MultiNetworkSigner,
  maxValue = BigInt(0.1 * 10 ** 6),
  paymentRequirementsSelector: PaymentRequirementsSelector = selectPaymentRequirements
) => {
  const config: X402Config = {
    svmConfig: {
      rpcUrl: env.NEXT_PUBLIC_SOLANA_RPC_URL,
    },
  };

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, init);

    if (response.status !== 402) {
      return response;
    }

    const {
      x402Version,
      accepts,
      resource: v2Resource,
      extensions: v2Extensions,
    } = await parse402Response(response);

    if (!accepts || accepts.length === 0) {
      throw new Error('No payment requirements found in 402 response');
    }

    // Parse and validate payment requirements
    // For v2, transform to v1 format first, but keep original accepts for the response
    const originalV2Accepts =
      x402Version >= 2 ? (accepts as V2Accept[]) : undefined;

    const parsedPaymentRequirements = accepts.map(x => {
      let acceptToValidate = x;
      if (x402Version >= 2) {
        acceptToValidate = transformV2AcceptToV1(x as V2Accept, v2Resource);
      }
      return PaymentRequirementsSchema.parse(acceptToValidate);
    });

    // Determine network from wallet type
    let network: Network | Network[] | undefined;
    if (isMultiNetworkSigner(walletClient)) {
      network = undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    } else if (evm.isSignerWallet(walletClient as any)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      const chainId = (walletClient as any).chain?.id as number | undefined;
      if (chainId !== undefined && chainId in ChainIdToNetwork) {
        network = ChainIdToNetwork[chainId];
      }
    } else if (isSvmSignerWallet(walletClient)) {
      network = ['solana', 'solana-devnet'] as Network[];
    }

    // Select the appropriate payment requirement
    const selectedPaymentRequirements = paymentRequirementsSelector(
      parsedPaymentRequirements,
      network,
      'exact'
    );

    // Find the index of the selected requirement to get the original v2 accept
    const selectedIndex = parsedPaymentRequirements.findIndex(
      pr => pr === selectedPaymentRequirements
    );
    const originalSelectedAccept = originalV2Accepts?.[selectedIndex];

    // Check payment amount
    if (BigInt(selectedPaymentRequirements.maxAmountRequired) > maxValue) {
      throw new Error(
        `Payment amount ${selectedPaymentRequirements.maxAmountRequired} exceeds maximum allowed ${maxValue}`
      );
    }

    // Create payment header using v1 library
    const v1PaymentHeader = await createPaymentHeader(
      walletClient,
      x402Version,
      selectedPaymentRequirements,
      config
    );

    // For v2, reconstruct the header with proper structure
    let paymentHeader: string;
    if (x402Version >= 2 && originalSelectedAccept) {
      try {
        // Decode the v1-style header to extract the payload
        const decodedV1Header = JSON.parse(atob(v1PaymentHeader)) as {
          payload?: {
            signature?: string;
            authorization?: Record<string, unknown>;
          };
        };

        // Construct proper v2 header structure
        const v2PaymentPayload = {
          x402Version: 2,
          resource: v2Resource,
          accepted: originalSelectedAccept,
          payload: decodedV1Header.payload,
          ...(v2Extensions ? { extensions: v2Extensions } : {}),
        };

        paymentHeader = btoa(JSON.stringify(v2PaymentPayload));
      } catch (error) {
        console.error(
          '[wrapFetchWithPayment] Failed to construct v2 header:',
          error
        );
        paymentHeader = v1PaymentHeader;
      }
    } else {
      paymentHeader = v1PaymentHeader;
    }

    // Check for retry loop
    const existingHeaders = new Headers(init?.headers);
    if (
      existingHeaders.has('X-PAYMENT') ||
      existingHeaders.has('PAYMENT-SIGNATURE')
    ) {
      throw new Error('Payment already attempted');
    }

    // Use correct header based on version
    const paymentHeaderName =
      x402Version >= 2 ? 'PAYMENT-SIGNATURE' : 'X-PAYMENT';

    const newInit: RequestInit = {
      ...init,
      headers: {
        ...Object.fromEntries(existingHeaders.entries()),
        [paymentHeaderName]: paymentHeader,
      },
    };

    const secondResponse = await fetch(input, newInit);
    return secondResponse;
  };
};
