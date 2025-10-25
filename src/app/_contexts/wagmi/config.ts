import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from 'wagmi';
import { base } from 'wagmi/chains';

export const baseWagmiConfig = {
  chains: [base],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [base.id]: http(),
  },
  connectors: [injected()],
  ssr: true,
} as const;

export const getServerConfig = () =>
  createConfig({
    ...baseWagmiConfig,
  });
