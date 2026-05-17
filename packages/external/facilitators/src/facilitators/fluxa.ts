import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const fluxa: FacilitatorConfig = {
  url: 'https://facilitator.fluxapay.xyz',
};

export const fluxaDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.fluxapay.xyz',
};

export const fluxaFacilitator = {
  id: 'fluxa',
  metadata: {
    name: 'FluxA',
    image: 'https://x402scan.com/fluxa.png',
    docsUrl: 'https://fluxapay.xyz',
    color: '#000000',
  },
  config: fluxa,
  discoveryConfig: fluxaDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x7f72a02c682e908d46a5677fe937cdb612d94a3b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
      {
        address: '0xc67b555b4a9d340ed7c5d87743163c31a75f2254',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
      {
        address: '0xaa0df01e4d11decf2ad2c459c81d3a495e4f1925',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
      {
        address: '0xb5d25e1fa0718bf3e1bf698f96791d4e93632ec8',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
      {
        address: '0x24d4f332d8e886fc005bb4a103bad21d9ebc2b7f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
      {
        address: '0xd2f74a14522d40e4a1d7fbb62aa97ce99fa1a7e5',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
      {
        address: '0x10aa4205354c3d51bbebe2b3731ec8233e744b7b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-05-15'),
      },
      {
        address: '0x17bc08fac74a151103098f6060382cde2d10269a',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-05-15'),
      },
      {
        address: '0x11898322b9da697a62aa1203472ffb3deb76ffce',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-05-15'),
      },
      {
        address: '0xfd7fe552064f11b4dfb7a4932b6c363a7b42a081',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-05-15'),
      },
    ],
  },
} as const satisfies Facilitator;
