import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';
import { Network } from '../types';

import type { Facilitator, FacilitatorConfig } from '../types';

export const soon: FacilitatorConfig = {
  url: 'https://facilitator.soo.network/',
};

export const soonFacilitator = {
  id: 'soon',
  metadata: {
    name: 'SOON',
    image: 'https://x402scan.com/soon.png',
    docsUrl: 'https://valiant-license-ca4.notion.site/Soon-X402-Facilitator-Usage-Guide-2c0e49a418fb803aaea5dba0c4c5a39f?pvs=73',
    color: '#F8F8FF',
  },
  config: soon,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xE4a1E17F764aE9c99318599F3309e81Ac8a16d59',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0x3b4dA5A09F806fA059908db275a736C6b02b81cA',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0xAE1606b342d3D108a41A803fD2eedc15D9d5b393',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0xF9b1234B458E22c84c8b7EA1c0b6eab8a8A61059',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0x64732D397D56036846E0dA6A1365cF512Cf3B03b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0xf9dB5417AD21186c2F96CC0083e7322fB9a34100',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0x786CAde266Be75Ef8a3954f98e3Fa35E42fD23Ba',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0xb7AA030231F4619BA23Fd5511D8Acd9FB348459B',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0x2d718B0eE08BA63790C888C1e8D8A24Da74EE21c',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
      {
        address: '0x86B767Ee9C1b89eE4dA0375C920a4Aa3A3753f45',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-21'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '34n7XkGa3w7Uc9cmtvj4Vc2aS18LgSQyQ27MgVcrH5X9',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-17'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
