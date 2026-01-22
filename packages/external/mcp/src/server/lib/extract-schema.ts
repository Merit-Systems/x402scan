import type { PaymentRequired } from '@x402/core/types';
import type { DiscoveryExtension } from '@x402/extensions/bazaar';

export const getSchema = (extensions: PaymentRequired['extensions']) => {
  const { bazaar } = extensions ?? {};

  if (!bazaar) {
    return undefined;
  }

  const { schema } = bazaar as DiscoveryExtension;

  return schema.properties.input;
};
