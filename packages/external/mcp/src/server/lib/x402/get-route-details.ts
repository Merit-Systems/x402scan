import { tokenStringToNumber } from '@/lib/token';
import type { PaymentRequired } from '@x402/core/types';
import type { DiscoveryExtension } from '@x402/extensions/bazaar';

export const getRouteDetails = (paymentRequired: PaymentRequired) => {
  const { accepts, extensions, resource } = paymentRequired;

  return {
    ...resource,
    schema: getSchema(extensions),
    paymentMethods: accepts.map(accept => ({
      price: tokenStringToNumber(accept.amount),
      network: accept.network,
      asset: accept.asset,
    })),
  };
};

export const getSchema = (extensions: PaymentRequired['extensions']) => {
  const { bazaar } = extensions ?? {};

  if (!bazaar) {
    return undefined;
  }

  const { schema } = bazaar as DiscoveryExtension;

  return schema.properties.input;
};
