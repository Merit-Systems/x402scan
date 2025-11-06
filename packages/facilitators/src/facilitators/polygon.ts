import { Network } from '../types';
import { USDC_POLYGON_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const polygon: FacilitatorConfig = {
  url: 'https://x402.polygon.technology',
};

export const polygonFacilitator = {
  id: 'polygon',
  metadata: {
    name: 'Polygon Facilitator',
    image: 'https://x402scan.com/polygon.png',
    docsUrl: 'https://agentic-docs.polygon.technology/general/x402/intro/',
    color: '#8247E5',
  },
  config: polygon,
  addresses: {
    [Network.POLYGON]: [
      {
        address: '0x29df60c005506AA325d7179F6e09eB4b4875dAde',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0xF09A94831C18566781f70937f0996B96EfE691C8',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x42618f623Ec19beFf78dE9DbBFB653BfEaC05D09',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x3202643514D128FF0B4625D2682c0244CF58131c',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x11DA3fe5ADA6f5382Ebe972f14C3585DA4E65AeA',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x135DfE729F9bbd7F88181E1B708d7506fd499140',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0xDcb0Ac359025dC0DB1e22e6d33F404e5c92A1564',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0x99EFc08BB42282716fB59D221792f5207f714C9d',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-22'),
      },
      {
        address: '0xbE5115800247405f020197BF473eBFd085a2C635',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
      {
        address: '0x5eAb3D78264Dab340340d6a37Ff0836464Ae5773',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
      {
        address: '0xE5D4197eFd5D03E3f30cBf11C0fF63Eb95a0A656',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
      {
        address: '0xfac8Edb989f1ba7F9dBb7A1233542D4e1fD6144F',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
      {
        address: '0xaFdbfaCb5ed691bf0bCFA660901f299ce9775489',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
      {
        address: '0x1e48Ed59a502D0B324CdAf83362865b3ff49ABa2',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
      {
        address: '0xA1dcBDC2C34577ACD4A1152A98807B2f281A112e',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
      {
        address: '0x9e281D4e26E1a4e7C27014E2ca8Cee7F2D44fa52',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
      {
        address: '0x76FCb8ae3365A487E6EA235386C1cf3AbADeDA60',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
      {
        address: '0x9523B120C75640469f1D16490Da0388928229452',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
      {
        address: '0x153F3A70e4400c211d9B482b62aD721Bb02F96F6',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
      {
        address: '0xd5dD012019C58882Dd507A8b3fCBB7b62e9a24c3',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
      {
        address: '0xfff23108338C218F895d75980E14688218D4E92a',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
      {
        address: '0xF744e153Ef63f7EEe4a58e0F13761D16C2125EE3',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
      {
        address: '0x0a8B10FE8Bd3072351600Adef4796F3F7aF72Ab0',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
      {
        address: '0x971b4079A618F72Fa0F1792b07ed5923dfBF3500',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
    ],
  },
} as const satisfies Facilitator;

