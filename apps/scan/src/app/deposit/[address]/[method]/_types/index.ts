import { OnrampMethods, OnrampProviders } from '@/services/onramp/types';

export type Methods = OnrampProviders | OnrampMethods.WALLET;

export interface MethodComponentProps {
  searchParams: Record<string, string | string[] | undefined>;
}
