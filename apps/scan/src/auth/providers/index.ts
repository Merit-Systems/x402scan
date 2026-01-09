import { env } from '@/env';
import SiweProvider from './siwe/provider';
import SiwsProvider from './siws/provider';
import PermiProvider from '@permi/authjs-provider';

export const providers = [
  SiweProvider(),
  SiwsProvider(),
  PermiProvider({
    appId: env.PERMI_APP_ID,
  }),
];
