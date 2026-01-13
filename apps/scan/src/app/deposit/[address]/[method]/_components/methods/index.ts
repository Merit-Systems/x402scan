import { MethodComponentProps, Methods } from '../../_types';
import { OnrampMethods } from '@/services/onramp/types';
import { OnrampProviders } from '@/services/onramp/types';
import { Coinbase } from './coinbase';

export const METHODS: Record<Methods, React.FC<MethodComponentProps>> = {
  [OnrampProviders.COINBASE]: Coinbase,
  [OnrampProviders.STRIPE]: Coinbase,
  [OnrampMethods.WALLET]: Coinbase,
};
