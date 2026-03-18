import type { OnrampMethods, OnrampProviders } from '@/services/onramp/types';
import type { Address } from 'viem';

export type Methods = OnrampProviders | OnrampMethods.WALLET;

export interface MethodComponentProps {
  searchParams: Record<string, string | string[] | undefined>;
  address: Address;
}
