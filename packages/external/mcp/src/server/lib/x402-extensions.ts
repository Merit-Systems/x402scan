import type { PaymentRequired } from '@x402/core/types';
import type { DiscoveryExtension } from '@x402/extensions/bazaar';
import type {
  SIWxExtension,
  CompleteSIWxInfo,
} from '@x402/extensions/sign-in-with-x';

const getBazaarExtension = (extensions: PaymentRequired['extensions']) => {
  const { bazaar } = extensions ?? {};

  if (!bazaar) {
    return undefined;
  }

  return bazaar as DiscoveryExtension;
};

export const getInputSchema = (extensions: PaymentRequired['extensions']) =>
  getBazaarExtension(extensions)?.schema.properties.input;

export const getSiwxExtension = (
  extensions: PaymentRequired['extensions']
): CompleteSIWxInfo | undefined => {
  const siwx = extensions?.['sign-in-with-x'] as SIWxExtension | undefined;
  if (!siwx?.info || !siwx?.supportedChains?.length) return undefined;

  const evmChain = siwx.supportedChains.find(c =>
    c.chainId.startsWith('eip155:')
  );
  if (!evmChain) return undefined;

  return { ...siwx.info, chainId: evmChain.chainId, type: evmChain.type };
};
