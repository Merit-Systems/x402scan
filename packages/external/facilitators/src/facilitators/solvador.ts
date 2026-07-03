import { Network } from '../types';
import {
  USDC_BASE_TOKEN,
  USDC_POLYGON_TOKEN,
  USDC_SOLANA_TOKEN,
} from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const solvador: FacilitatorConfig = {
  url: 'https://api.solvador.com',
};

export const solvadorFacilitator = {
  id: 'solvador',
  metadata: {
    name: 'Solvador',
    image: 'https://x402scan.com/solvador.png',
    docsUrl: 'https://solvador.com',
    color: '#C0592E',
  },
  config: solvador,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xC077C1A915A61021b16d1581067C828b7C76F8e7',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-23'),
      },
    ],
    [Network.POLYGON]: [
      {
        address: '0xC077C1A915A61021b16d1581067C828b7C76F8e7',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-23'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '3uCK3sWUFZPPBdLBYskYvUnAgJV9HYXvptgHcdti69qo',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-23'),
      },
    ],
  },
} as const satisfies Facilitator;
