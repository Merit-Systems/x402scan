import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const x402x: FacilitatorConfig = {
  url: 'https://facilitator.x402x.dev',
};

export const x402xFacilitator = {
  id: 'x402x',
  metadata: {
    name: 'X402x',
    image: 'https://x402scan.com/x402x.svg',
    docsUrl: 'https://www.x402x.dev',
    color: '#00d1ff',
  },
  config: x402x,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x0852a46253b28e6bd9dbb676b445da5e5df8a595',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-13'),
      },
      {
        address: '0x26b10c2a56dc94b479ec8d77dd756492c33f32bb',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-16'),
      },
      {
        address: '0xdcf9adc84dd18b74fa37f7068436ec22eb45857d',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-16'),
      },
      {
        address: '0x194c26e69b6cad044b80a6b25e43bdb381743d28',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-16'),
      },
      {
        address: '0x6c9e645d9a2f1eaae1fc84b2e3acb80ab5da6535',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-16'),
      },
      {
        address: '0x30f0e97d13ef6b7d08130b2569c40cfc5dc33cc0',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-16'),
      },
      {
        address: '0x3b37152a76d4e55162552f54da919580e9ee7b07',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-04'),
      },
      {
        address: '0xf191ee96f115beb213947147a12a4afbcaa42e1d',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-04'),
      },
      {
        address: '0x7873a8874d903c0e548557dc94101cb5f23f0057',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-04'),
      },
      {
        address: '0xcf3d25f66fc21f7c23a6af7298bbb844b03636ec',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-04'),
      },
      {
        address: '0xd15fcaee825b48d402e2148877999bea8efd9e01',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-04'),
      },
    ],
  },
} as const satisfies Facilitator;
