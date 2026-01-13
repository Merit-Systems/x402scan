import type { Address } from 'viem';

export interface OnrampProviderDialogContentProps {
  amount: number;
  quote: number;
  address: Address;
}

export interface OnrampProviderMetadata {
  title: string;
  description: string;
  icon: string;
  DialogContent: React.FC<OnrampProviderDialogContentProps>;
}
