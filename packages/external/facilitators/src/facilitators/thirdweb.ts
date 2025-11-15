import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_POLYGON_TOKEN } from '../constants';
import type {
  Facilitator,
  FacilitatorConfig,
  FacilitatorConfigConstructor,
} from '../types';

type ThirdwebConfig = {
  secretKey: string;
};

const FACILITATOR_URL = 'https://api.thirdweb.com/v1/payments/x402';

export const thirdweb: FacilitatorConfigConstructor<ThirdwebConfig> = ({
  secretKey,
}) => ({
  url: FACILITATOR_URL,
  createAuthHeaders: async () => {
    return {
      verify: {
        'x-secret-key': secretKey,
      },
      settle: {
        'x-secret-key': secretKey,
      },
      supported: {
        'x-secret-key': secretKey,
      },
      list: {
        'x-secret-key': secretKey,
      },
    };
  },
});

export const thirdwebDiscovery: FacilitatorConfig = {
  url: FACILITATOR_URL,
};

export const thirdwebFacilitator = {
  id: 'thirdweb',
  metadata: {
    name: 'Thirdweb',
    image: 'https://x402scan.com/thirdweb.png',
    docsUrl: 'https://portal.thirdweb.com/payments/x402/facilitator',
    color: '#E91E8C',
  },
  config: thirdweb,
  discoveryConfig: {
    url: FACILITATOR_URL,
  },
  addresses: {
    [Network.BASE]: [
      {
        address: '0x80c08de1a05df2bd633cf520754e40fde3c794d3',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-07'),
      },
    ],
    [Network.POLYGON]: [
      {
        address: '0x80c08de1a05df2bd633cf520754e40fde3c794d3',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-07'),
      },
    ],
  },
} as const satisfies Facilitator<ThirdwebConfig>;
