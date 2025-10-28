import {
  USDC_BASE_TOKEN,
  USDC_POLYGON_TOKEN,
  USDC_SOLANA_TOKEN,
} from './constants';
import { Chain, Facilitator } from './types';
import { validateUniqueFacilitators } from './validate';

const _FACILITATORS = validateUniqueFacilitators([
  {
    id: 'coinbase',
    name: 'Coinbase',
    image: '/coinbase.png',
    link: 'https://docs.cdp.coinbase.com/x402/welcome',
    color: 'var(--color-primary)',
    addresses: {
      [Chain.BASE]: [
        {
          address: '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-05-05'),
          enabled: true,
        },
      ],
      [Chain.SOLANA]: [
        {
          address: 'L54zkaPQFeTn1UsEqieEXBqWrPShiaZEPD7mS5WXfQg',
          token: USDC_SOLANA_TOKEN,
          syncStartDate: new Date('2025-10-24'),
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'aurracloud',
    name: 'AurraCloud',
    image: '/aurracloud.png',
    link: 'https://x402-facilitator.aurracloud.com',
    color: 'var(--color-gray-600)',
    addresses: {
      [Chain.BASE]: [
        {
          address: '0x222c4367a2950f3b53af260e111fc3060b0983ff',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-10-05'),
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'thirdweb',
    name: 'thirdweb',
    image: '/thirdweb.png',
    link: 'https://portal.thirdweb.com/payments/x402/facilitator',
    color: 'var(--color-pink-600)',
    addresses: {
      [Chain.BASE]: [
        {
          address: '0x80c08de1a05df2bd633cf520754e40fde3c794d3',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-10-07'),
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'x402rs',
    name: 'X402rs',
    image: '/x402rs.png',
    link: 'https://x402.rs',
    color: 'var(--color-blue-400)',
    addresses: {
      [Chain.POLYGON]: [
        {
          address: '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec',
          token: USDC_POLYGON_TOKEN,
          syncStartDate: new Date('2025-04-01'),
          enabled: false,
        },
      ],
      [Chain.BASE]: [
        {
          address: '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2024-12-05'),
          enabled: true,
        },
        {
          address: '0x97D38AA5dE015245DCCa76305b53ABE6DA25F6a5',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-10-20'),
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'payAI',
    name: 'PayAI',
    image: '/payai.png',
    link: 'https://payai.network',
    color: 'var(--color-purple-600)',
    addresses: {
      [Chain.SOLANA]: [
        {
          address: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4',
          token: USDC_SOLANA_TOKEN,
          syncStartDate: new Date('2025-07-01'),
          enabled: true,
        },
      ],
      [Chain.BASE]: [
        {
          address: '0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-05-18'),
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'corbits',
    name: 'Corbits',
    image: '/corbits.png',
    link: 'https://corbits.dev',
    color: 'var(--color-orange-600)',
    addresses: {
      [Chain.SOLANA]: [
        {
          address: 'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU',
          token: USDC_SOLANA_TOKEN,
          syncStartDate: new Date('2025-9-21'),
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'daydreams',
    name: 'Daydreams',
    image: '/router-logo-small.png',
    link: 'https://facilitator.daydreams.systems',
    color: 'var(--color-yellow-600)',
    addresses: {
      [Chain.BASE]: [
        {
          address: '0x279e08f711182c79Ba6d09669127a426228a4653',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-10-16'),
          enabled: true,
        },
      ],
      [Chain.SOLANA]: [
        {
          address: 'DuQ4jFMmVABWGxabYHFkGzdyeJgS1hp4wrRuCtsJgT9a',
          token: USDC_SOLANA_TOKEN,
          syncStartDate: new Date('2025-10-16'),
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'mogami',
    name: 'Mogami',
    image: '/mogami.png',
    link: 'https://mogami.tech/',
    color: 'var(--color-green-600)',
    addresses: {
      [Chain.BASE]: [
        {
          address: '0xfe0920a0a7f0f8a1ec689146c30c3bbef439bf8a',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-10-24'),
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'openx402',
    name: 'OpenX402',
    image: '/openx402.png',
    link: 'https://open.x402.host',
    color: 'var(--color-blue-100)',
    addresses: {
      [Chain.BASE]: [
        {
          address: '0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-10-16'),
          enabled: true,
        },
        {
          address: '0x97db9b5291a218fc77198c285cefdc943ef74917',
          token: USDC_BASE_TOKEN,
          syncStartDate: new Date('2025-10-16'),
          enabled: true,
        },
      ],
      [Chain.SOLANA]: [
        {
          address: '5xvht4fYDs99yprfm4UeuHSLxMBRpotfBtUCQqM3oDNG',
          token: USDC_SOLANA_TOKEN,
          syncStartDate: new Date('2025-10-16'),
          enabled: true,
        },
      ],
    },
  },
] as const);

export const FACILITATORS: Facilitator[] =
  _FACILITATORS as unknown as Facilitator[];

export const FACILITATORS_BY_CHAIN = function (chain: Chain) {
  return FACILITATORS.filter(f => f.addresses[chain]);
};
