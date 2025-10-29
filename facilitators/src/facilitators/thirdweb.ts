import {
  Network,
  Facilitator,
  FacilitatorConfig,
  FacilitatorConfigConstructor,
} from '../types';
import { USDC_BASE_TOKEN } from '../constants';
import { createThirdwebClient } from 'thirdweb';
import { facilitator } from 'thirdweb/x402';

interface ThirdwebProps {
  secretKey: string;
  serverWalletAddress: string;
}

export const thirdweb: FacilitatorConfigConstructor<ThirdwebProps> = ({
  secretKey,
  serverWalletAddress,
}) => {
  const client = createThirdwebClient({
    secretKey,
  });
  return facilitator({
    client,
    serverWalletAddress,
  });
};
export const thirdwebDiscovery: FacilitatorConfig = {
  url: 'https://api.thirdweb.com/v1/payments/x402',
};

export const thirdwebFacilitator = {
  id: 'thirdweb',
  metadata: {
    name: 'thirdweb',
    image: 'https://x402scan.com/thirdweb.png',
    docsUrl: 'https://portal.thirdweb.com/payments/x402/facilitator',
    color: 'var(--color-pink-600)',
  },
  config: thirdweb,
  discoveryConfig: {
    url: 'https://api.thirdweb.com/v1/payments/x402',
  },
  addresses: {
    [Network.BASE]: [
      {
        address: '0x80c08de1a05df2bd633cf520754e40fde3c794d3',
        tokens: [USDC_BASE_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator<ThirdwebProps>;
