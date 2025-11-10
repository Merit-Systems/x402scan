import type { Facilitator, FacilitatorConfig } from '../types';
import { Network } from '../types';
import { USDC_BSC_TOKEN } from '../constants';

export const aeon: FacilitatorConfig = {
  url: 'https://aeon.xyz/',
};

export const aeonFacilitator = {
  id: 'aeon',
  metadata: {
    name: 'aeon',
    image: '/aeon.png',
    docsUrl: 'https://github.com/AEON-Project/bnb-x402',
    color: '#36D399',
  },
  config: aeon,
  addresses: {
    [Network.BSC]: [
      {
        address: '0xa0a35e76e4476bd62fe452899af7aea6d1b20ab7',
        tokens: [USDC_BSC_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-10'),
      }
    ]
  },
} as const satisfies Facilitator;
