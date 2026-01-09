import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_POLYGON_TOKEN } from '../constants';
import type {
  Facilitator,
  FacilitatorConfig,
  FacilitatorConfigConstructor,
} from '../types';

interface ThirdwebConfig {
  secretKey: string;
}

const FACILITATOR_URL = 'https://api.thirdweb.com/v1/payments/x402';

export const thirdweb: FacilitatorConfigConstructor<ThirdwebConfig> = ({
  secretKey,
}) => ({
  url: FACILITATOR_URL,
  createAuthHeaders: async () => {
    return Promise.resolve({
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
    });
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
      {
        address: '0xaaca1ba9d2627cbc0739ba69890c30f95de046e4',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      },
      {
        address: '0xa1822b21202a24669eaf9277723d180cd6dae874',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      },
      {
        address: '0xec10243b54df1a71254f58873b389b7ecece89c2',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      },
      {
        address: '0x052aaae3cad5c095850246f8ffb228354c56752a',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      },
      {
        address: '0x91ddea05f741b34b63a7548338c90fc152c8631f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      },
      {
        address: '0xea52f2c6f6287f554f9b54c5417e1e431fe5710e',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      },
      {
        address: '0x3a5ca1c6aa6576ae9c1c0e7fa2b4883346bc5aa0',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      },
      {
        address: '0x7e20b62bf36554b704774afb0fcc0ae8f899213b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      },
      {
        address: '0xd88a9a58806b895ff06744082c6a20b9d7184b0f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
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
