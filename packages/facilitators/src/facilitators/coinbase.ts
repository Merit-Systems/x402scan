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
        address: '0x9aae2b0d1b9dc55ac9bab9556f9a26cb64995fb9',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x3a70788150c7645a21b95b7062ab1784d3cc2104',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x708e57b6650a9a741ab39cae1969ea1d2d10eca1',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0xce82eeec8e98e443ec34fda3c3e999cbe4cb6ac2',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x7f6d822467df2a85f792d4508c5722ade96be056',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x001ddabba5782ee48842318bd9ff4008647c8d9c',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x9c09faa49c4235a09677159ff14f17498ac48738',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0xcbb10c30a9a72fae9232f41cbbd566a097b4e03a',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x9fb2714af0a84816f5c6322884f2907e33946b88',
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
