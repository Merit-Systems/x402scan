import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const meshgateway: FacilitatorConfig = {
  url: 'https://facilitator.meshgateway.co',
};

export const meshgatewayFacilitator = {
  id: 'meshgateway',
  metadata: {
    name: 'MeshGateway',
    image: '/meshgateway.png',
    docsUrl: 'https://meshgateway.co/facilitator',
    color: '#f5f5f5',
  },
  config: meshgateway,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xc231248d8f821cf5e03dcc11a9258ff8596b1dc3',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-08-26'),
      },
    ],
  },
} as const satisfies Facilitator;
