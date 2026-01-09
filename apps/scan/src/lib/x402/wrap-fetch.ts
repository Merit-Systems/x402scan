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

// Re-export types for consumers
export type { Signer, MultiNetworkSigner, PaymentRequirementsSelector };

/**
 * v2 accept format (CAIP-2 networks, different field names)
 */
interface V2Accept {
  scheme: string;
  network: string;
  amount?: string;
  maxAmountRequired?: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
  // v1 fields that might be present
  resource?: string;
  description?: string;
  mimeType?: string;
}

/**
 * v2 resource info (at top level, not in each accept)
 */
interface V2Resource {
  url?: string;
  description?: string;
  mimeType?: string;
}

/**
 * Transform v2 accept to v1 format for compatibility with PaymentRequirementsSchema
 */
function transformV2AcceptToV1(
  accept: V2Accept,
  resource?: V2Resource
): Record<string, unknown> {
  // Convert CAIP-2 network (eip155:8453) to named network (base)
  let network: string = accept.network;
  if (typeof network === 'string' && network.startsWith('eip155:')) {
    const chainIdStr = network.split(':')[1];
    if (chainIdStr) {
      const chainId = parseInt(chainIdStr, 10);
      const namedNetwork = ChainIdToNetwork[chainId];
      if (namedNetwork) {
        network = namedNetwork;
      }
    }
  }
  // Handle Solana CAIP-2 format
  if (network === 'solana:mainnet' || network === 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp') {
    network = 'solana';
  }
  if (network === 'solana:devnet' || network === 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1') {
    network = 'solana-devnet';
  }

  const transformed = {
    ...accept,
    network,
    // v2 uses 'amount', v1 uses 'maxAmountRequired'
    maxAmountRequired: accept.amount ?? accept.maxAmountRequired,
    // v2 has resource info at top level, v1 has it in each accept
    resource: accept.resource ?? resource?.url ?? '',
    description: accept.description ?? resource?.description ?? '',
    mimeType: accept.mimeType ?? resource?.mimeType ?? '',
  };

  console.log('[transformV2AcceptToV1] Transformed:', {
    original: accept,
    resource,
    result: transformed,
  });

  return transformed;
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
    const inputUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    console.log('[wrapFetchWithPayment] Making request:', {
      url: inputUrl,
      method: init?.method,
      hasBody: !!init?.body,
    });

    const response = await fetch(input, init);

    console.log('[wrapFetchWithPayment] Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (response.status !== 402) {
      console.log('[wrapFetchWithPayment] Not a 402, returning response');
      return response;
    }

    console.log('[wrapFetchWithPayment] Got 402, parsing payment requirements...');

    // Parse payment requirements - try v2 header first, then v1 body
    let x402Version: number;
    let accepts: unknown[];
    let v2Resource: V2Resource | undefined;
    let v2Extensions: Record<string, unknown> | undefined;

    const paymentRequiredHeader = response.headers.get('Payment-Required');
    console.log('[wrapFetchWithPayment] Payment-Required header:', paymentRequiredHeader ? 'present' : 'absent');

    if (paymentRequiredHeader) {
      // v2: decode from base64 header
      try {
        console.log('[wrapFetchWithPayment] Decoding v2 header...');
        const decoded = Buffer.from(paymentRequiredHeader, 'base64').toString(
          'utf-8'
        );
        console.log('[wrapFetchWithPayment] Decoded header:', decoded);
        const parsed = JSON.parse(decoded) as {
          x402Version?: number;
          accepts?: unknown[];
          resource?: V2Resource;
          extensions?: Record<string, unknown>;
        };
        console.log('[wrapFetchWithPayment] Parsed header:', parsed);
        x402Version = parsed.x402Version ?? 2;
        accepts = parsed.accepts ?? [];
        v2Resource = parsed.resource;
        v2Extensions = parsed.extensions;
        console.log('[wrapFetchWithPayment] v2 response from header:', {
          x402Version,
          acceptsCount: accepts.length,
          accepts,
          resource: v2Resource,
          extensions: v2Extensions,
        });
      } catch (error) {
        console.error(
          '[wrapFetchWithPayment] Failed to parse Payment-Required header:',
          error
        );
        throw new Error('Failed to parse Payment-Required header');
      }
    } else {
      // v1 or v2 from body
      try {
        console.log('[wrapFetchWithPayment] Reading body...');
        const clonedResponse = response.clone();
        const rawText = await clonedResponse.text();
        console.log('[wrapFetchWithPayment] Raw body text:', rawText);
        
        const body = JSON.parse(rawText) as {
          x402Version?: number;
          accepts?: unknown[];
          resource?: V2Resource;
          extensions?: Record<string, unknown>;
        };
        console.log('[wrapFetchWithPayment] Parsed body:', body);
        x402Version = body.x402Version ?? 1;
        accepts = body.accepts ?? [];
        v2Resource = body.resource;
        v2Extensions = body.extensions;
        console.log('[wrapFetchWithPayment] Response from body:', {
          x402Version,
          acceptsCount: accepts.length,
          accepts,
          resource: v2Resource,
          extensions: v2Extensions,
        });
      } catch (error) {
        console.error(
          '[wrapFetchWithPayment] Failed to parse 402 response body:',
          error
        );
        throw new Error('Failed to parse 402 response body');
      }
    }

    if (!accepts || accepts.length === 0) {
      console.error('[wrapFetchWithPayment] No accepts found!');
      throw new Error('No payment requirements found in 402 response');
    }

    // Parse and validate payment requirements
    // For v2, transform to v1 format first, but keep original accepts for the response
    console.log('[wrapFetchWithPayment] Parsing payment requirements (v' + x402Version + ')...');
    const originalV2Accepts = x402Version >= 2 ? (accepts as V2Accept[]) : undefined;
    
    const parsedPaymentRequirements = accepts.map((x, i) => {
      console.log(`[wrapFetchWithPayment] Processing accept[${i}]:`, x);
      
      // Transform v2 format to v1 format if needed
      let acceptToValidate = x;
      if (x402Version >= 2) {
        acceptToValidate = transformV2AcceptToV1(x as V2Accept, v2Resource);
      }
      
      console.log(`[wrapFetchWithPayment] Validating accept[${i}]:`, acceptToValidate);
      return PaymentRequirementsSchema.parse(acceptToValidate);
    });
    console.log('[wrapFetchWithPayment] Parsed requirements:', parsedPaymentRequirements);

    // Determine network from wallet type
    // Note: Type casting needed due to complex union types in x402
    let network: Network | Network[] | undefined;
    if (isMultiNetworkSigner(walletClient)) {
      network = undefined;
      console.log('[wrapFetchWithPayment] MultiNetworkSigner detected');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    } else if (evm.isSignerWallet(walletClient as any)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      const chainId = (walletClient as any).chain?.id as number | undefined;
      console.log('[wrapFetchWithPayment] EVM wallet, chainId:', chainId);
      if (chainId !== undefined && chainId in ChainIdToNetwork) {
        network = ChainIdToNetwork[chainId];
      }
    } else if (isSvmSignerWallet(walletClient)) {
      network = ['solana', 'solana-devnet'] as Network[];
      console.log('[wrapFetchWithPayment] SVM wallet detected');
    }
    console.log('[wrapFetchWithPayment] Determined network:', network);

    // Select the appropriate payment requirement
    console.log('[wrapFetchWithPayment] Selecting payment requirement...');
    const selectedPaymentRequirements = paymentRequirementsSelector(
      parsedPaymentRequirements,
      network,
      'exact'
    );
    console.log('[wrapFetchWithPayment] Selected:', selectedPaymentRequirements);

    // Find the index of the selected requirement to get the original v2 accept
    const selectedIndex = parsedPaymentRequirements.findIndex(
      pr => pr === selectedPaymentRequirements
    );
    const originalSelectedAccept = originalV2Accepts?.[selectedIndex];
    console.log('[wrapFetchWithPayment] Selected index:', selectedIndex, 'Original v2 accept:', originalSelectedAccept);

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
        const decodedV1Header = JSON.parse(
          Buffer.from(v1PaymentHeader, 'base64').toString('utf-8')
        ) as { payload?: { signature?: string; authorization?: Record<string, unknown> } };
        
        console.log('[wrapFetchWithPayment] Decoded v1 header:', decodedV1Header);
        
        // Construct proper v2 header structure
        const v2PaymentPayload = {
          x402Version: 2,
          resource: v2Resource,
          accepted: originalSelectedAccept,
          payload: decodedV1Header.payload,
          ...(v2Extensions ? { extensions: v2Extensions } : {}),
        };
        
        console.log('[wrapFetchWithPayment] Constructed v2 payload:', v2PaymentPayload);
        
        paymentHeader = Buffer.from(JSON.stringify(v2PaymentPayload)).toString('base64');
      } catch (error) {
        console.error('[wrapFetchWithPayment] Failed to construct v2 header:', error);
        // Fall back to v1 header
        paymentHeader = v1PaymentHeader;
      }
    } else {
      paymentHeader = v1PaymentHeader;
    }

    if (!init) {
      throw new Error('Missing fetch request configuration');
    }

    // Check for retry loop
    const existingHeaders = new Headers(init.headers);
    if (
      existingHeaders.has('X-PAYMENT') ||
      existingHeaders.has('PAYMENT-SIGNATURE')
    ) {
      throw new Error('Payment already attempted');
    }

    // Use correct header based on version
    const paymentHeaderName =
      x402Version >= 2 ? 'PAYMENT-SIGNATURE' : 'X-PAYMENT';
    const exposeHeaderName =
      x402Version >= 2 ? 'PAYMENT-RESPONSE' : 'X-PAYMENT-RESPONSE';

    console.log('[wrapFetchWithPayment] Retrying with payment:', {
      x402Version,
      paymentHeaderName,
      network: selectedPaymentRequirements.network,
      amount: selectedPaymentRequirements.maxAmountRequired,
      headerPreview: paymentHeader.substring(0, 100) + '...',
    });

    const newInit: RequestInit = {
      ...init,
      headers: {
        ...Object.fromEntries(existingHeaders.entries()),
        [paymentHeaderName]: paymentHeader,
        'Access-Control-Expose-Headers': `${exposeHeaderName},X-PAYMENT-RESPONSE,PAYMENT-RESPONSE`,
      },
    };

    const secondResponse = await fetch(input, newInit);
    return secondResponse;
  };
};
