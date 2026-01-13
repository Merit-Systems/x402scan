import { CoinbaseOnrampDialogContent } from './coinbase/dialog';
import { StripeOnrampDialogContent } from './stripe/dialog';
import type { OnrampProviderMetadata } from './types';
import { OnrampProviders } from '@/services/onramp/types';

export const ONRAMP_PROVIDERS: Record<OnrampProviders, OnrampProviderMetadata> =
  {
    [OnrampProviders.STRIPE]: {
      title: 'Stripe',
      description: 'Only available in the United States',
      icon: '/stripe.png',
      DialogContent: StripeOnrampDialogContent,
    },
    [OnrampProviders.COINBASE]: {
      title: 'Coinbase',
      description: 'Additional fees apply to users without a Coinbase account',
      icon: '/coinbase.png',
      DialogContent: CoinbaseOnrampDialogContent,
    },
  };
