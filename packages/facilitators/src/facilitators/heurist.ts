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
        address: '0xb578b7db22581507D62BdBeb85E06AcD1bE09e11',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-07'),
      },
      {
        address: '0x021CC47ADEca6673DEF958e324ca38023b80A5Be',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-07'),
      },
      {
        address: '0x3f61093f61817B29d9556D3B092E67746AF8CdFd',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-06'),
      },
      {
        address: '0x021CC47ADEca6673DEF958e324ca38023b80A5Be',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-06'),
      },
      {
        address: '0x612d72Dc8402bBa997C61aa82ce718Ea23B2DF5D',
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
