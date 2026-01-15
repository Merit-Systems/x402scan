import { OnrampMethods } from '@/services/onramp/types';
import { OnrampProviders } from '@/services/onramp/types';
import { Coinbase } from './coinbase';
import { Stripe } from './stripe';
import { Wallet } from './wallet';

import type { MethodComponentProps, Methods } from '../../_types';

export const METHODS: Record<Methods, React.FC<MethodComponentProps>> = {
  [OnrampProviders.COINBASE]: Coinbase,
  [OnrampProviders.STRIPE]: Stripe,
  [OnrampMethods.WALLET]: Wallet,
};
