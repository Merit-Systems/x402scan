import type {
  X402V1PaymentOption,
  X402V2PaymentOption,
} from '@agentcash/discovery';

export type X402PaymentOption = X402V1PaymentOption | X402V2PaymentOption;

export function isX402PaymentOption(option: {
  protocol: string;
}): option is X402PaymentOption {
  return option.protocol === 'x402';
}
