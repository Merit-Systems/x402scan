import type { Address } from 'viem';
import type { DepositSearchParams } from '../../../../_lib/params';

export interface OnrampProviderDialogContentProps {
  amount: number;
  quote: number;
  address: Address;
  searchParams?: DepositSearchParams;
}

export interface OnrampProviderMetadata {
  title: string;
  description: string;
  icon: string;
  DialogContent: React.FC<OnrampProviderDialogContentProps>;
}
