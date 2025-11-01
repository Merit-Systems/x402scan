import { Network } from '../types';
import { USDC_POLYGON_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const polygon: FacilitatorConfig = {
  url: 'https://x402.polygon.technology',
};

export const polygonFacilitator = {
  id: 'polygon',
  metadata: {
    name: 'Polygon Facilitator',
    image: 'https://x402scan.com/polygon.png',
    docsUrl: 'https://agentic-docs.polygon.technology/general/x402/intro/',
    color: '#8247E5',
  },
  config: polygon,
  addresses: {
    [Network.POLYGON]: [
      {
        address: '0x29df60c005506AA325d7179F6e09eB4b4875dAde',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0xF09A94831C18566781f70937f0996B96EfE691C8',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x42618f623Ec19beFf78dE9DbBFB653BfEaC05D09',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x3202643514D128FF0B4625D2682c0244CF58131c',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x11DA3fe5ADA6f5382Ebe972f14C3585DA4E65AeA',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x135DfE729F9bbd7F88181E1B708d7506fd499140',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0xDcb0Ac359025dC0DB1e22e6d33F404e5c92A1564',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x99EFc08BB42282716fB59D221792f5207f714C9d',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
    ],
  },
} as const satisfies Facilitator;

