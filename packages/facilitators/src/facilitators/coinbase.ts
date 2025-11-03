import { facilitator } from '@coinbase/x402';

import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const coinbase: FacilitatorConfig = facilitator;
export const coinbaseDiscovery: FacilitatorConfig = facilitator;

export const coinbaseFacilitator = {
  id: 'coinbase',
  metadata: {
    name: 'Coinbase',
    image: 'https://x402scan.com/coinbase.png',
    docsUrl: 'https://docs.cdp.coinbase.com/x402/welcome',
    color: '#2563EB',
  },
  config: coinbase,
  discoveryConfig: coinbaseDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-05-05'),
      },
      {
        address: '0x9aAE2B0d1b9dC55Ac9Bab9556F9a26Cb64995Fb9'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x3A70788150c7645a21b95b7062ab1784D3cc2104'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x708E57B6650a9a741Ab39CAE1969Ea1D2D10ECA1'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0xCE82Eeec8e98e443EC34Fda3c3E999Cbe4Cb6aC2'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x7f6D822467Df2A85F792d4508c5722ade96Be056'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x001dDaBbA5782eE48842318BD9FF4008647c8D9C'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x9C09FAa49C4235A09677159fF14f17498ac48738'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0xcbB10C30a9a72fae9232F41CBbd566a097B4E03a'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x9fb2714AF0A84816F5C6322884F2907E33946b88'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'L54zkaPQFeTn1UsEqieEXBqWrPShiaZEPD7mS5WXfQg',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-24'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
