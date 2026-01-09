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
      {
        address: '0x47d8b3c9717e976f31025089384f23900750a5f4',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0x94701e1df9ae06642bf6027589b8e05dc7004813',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0x552300992857834c0ad41c8e1a6934a5e4a2e4ca',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0xd7469bf02d221968ab9f0c8b9351f55f8668ac4f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0x88800e08e20b45c9b1f0480cf759b5bf2f05180c',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0x6831508455a716f987782a1ab41e204856055cc2',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0xdc8fbad54bf5151405de488f45acd555517e0958',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0x91d313853ad458addda56b35a7686e2f38ff3952',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0xadd5585c776b9b0ea77e9309c1299a40442d820f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0x4ffeffa616a1460570d1eb0390e264d45a199e91',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
      {
        address: '0x8f5cb67b49555e614892b7233cfddebfb746e531',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
      {
        address: '0x67b9ce703d9ce658d7c4ac3c289cea112fe662af',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
      {
        address: '0x68a96f41ff1e9f2e7b591a931a4ad224e7c07863',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
      {
        address: '0x97acce27d5069544480bde0f04d9f47d7422a016',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
      {
        address: '0xa32ccda98ba7529705a059bd2d213da8de10d101',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'L54zkaPQFeTn1UsEqieEXBqWrPShiaZEPD7mS5WXfQg',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-24'),
      },
      {
        address: 'BENrLoUbndxoNMUS5JXApGMtNykLjFXXixMtpDwDR9SP',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
      {
        address: 'BFK9TLC3edb13K6v4YyH3DwPb5DSUpkWvb7XnqCL9b4F',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
      {
        address: 'D6ZhtNQ5nT9ZnTHUbqXZsTx5MH2rPFiBBggX4hY1WePM',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
      {
        address: 'GVJJ7rdGiXr5xaYbRwRbjfaJL7fmwRygFi1H6aGqDveb',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
      {
        address: 'Hc3sdEAsCGQcpgfivywog9uwtk8gUBUZgsxdME1EJy88',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-16'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
