import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const heurist: FacilitatorConfig = {
  url: 'https://facilitator.heurist.xyz',
};

export const heuristFacilitator = {
  id: 'heurist',
  metadata: {
    name: 'Heurist',
    image: '/heurist.png',
    docsUrl: 'https://docs.heurist.ai/x402-products/facilitator',
    color: '#CDF138',
  },
  config: heurist,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xb578b7db22581507d62bdbeb85e06acd1be09e11',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-07'),
      },
      {
        address: '0x021cc47adeca6673def958e324ca38023b80a5be',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-07'),
      },
      {
        address: '0x3f61093f61817b29d9556d3b092e67746af8cdfd',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-06'),
      },
      {
        address: '0x021cc47adeca6673def958e324ca38023b80a5be',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-06'),
      },
      {
        address: '0x612d72dc8402bba997c61aa82ce718ea23b2df5d',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-06'),
      },
      {
        address: '0x1fc230ee3c13d0d520d49360a967dbd1555c8326',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-10'),
      },
      {
        address: '0x48ab4b0af4ddc2f666a3fcc43666c793889787a3',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-10'),
      },
      {
        address: '0xd97c12726dcf994797c981d31cfb243d231189fb',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-10'),
      },
      {
        address: '0x90d5e567017f6c696f1916f4365dd79985fce50f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-10'),
      },
    ],
  },
} as const satisfies Facilitator;
