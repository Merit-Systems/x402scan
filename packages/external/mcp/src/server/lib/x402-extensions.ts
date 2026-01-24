import type { PaymentRequired } from '@x402/core/types';
import type { DiscoveryExtension } from '@x402/extensions/bazaar';
import type { SIWxExtensionInfo } from '../../../../siwx/dist/types';

const getBazaarExtension = (extensions: PaymentRequired['extensions']) => {
  const { bazaar } = extensions ?? {};

  if (!bazaar) {
    return undefined;
  }

  return bazaar as DiscoveryExtension;
};

export const getInputSchema = (extensions: PaymentRequired['extensions']) =>
  getBazaarExtension(extensions)?.schema.properties.input;

export const getSiwxExtension = (extensions: PaymentRequired['extensions']) => {
  const siwx = extensions?.['sign-in-with-x'] as
    | { info?: SIWxExtensionInfo }
    | undefined;

  if (!siwx?.info) {
    return undefined;
  }

  return siwx.info;
};
