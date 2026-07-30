import { Network } from '../types';
import {
  USDC_BASE_TOKEN,
  USDC_POLYGON_TOKEN,
  USDC_SOLANA_TOKEN,
} from '../constants';

import type { Facilitator, FacilitatorConfigConstructor } from '../types';

interface SolvadorProps {
  apiKey: string;
}

export const solvador: FacilitatorConfigConstructor<SolvadorProps> = ({
  apiKey,
}) => ({
  url: 'https://api.solvador.com',
  createAuthHeaders: () => {
    return Promise.resolve({
      verify: {
        'x-api-key': apiKey,
      },
      settle: {
        'x-api-key': apiKey,
      },
      supported: {},
    });
  },
});

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
        address: '0xc077c1a915a61021b16d1581067c828b7c76f8e7',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-25'),
      },
    ],
    [Network.POLYGON]: [
      {
        address: '0xc077c1a915a61021b16d1581067c828b7c76f8e7',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2026-07-03'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '3uCK3sWUFZPPBdLBYskYvUnAgJV9HYXvptgHcdti69qo',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-25'),
      },
    ],
  },
} as const satisfies Facilitator<SolvadorProps>;
