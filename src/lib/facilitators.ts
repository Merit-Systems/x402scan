import { Chain } from '@/types/chain';

import type { MixedAddress, SolanaAddress } from '@/types/address';
import { mixedAddressSchema } from './schemas';

export type Facilitator = {
  id: string;
  name: string;
  image: string;
  link: string;
  addresses: Partial<Record<Chain, MixedAddress[]>>;
  color: string;
};

const coinbaseFacilitator: Facilitator = {
  id: 'coinbase',
  name: 'Coinbase' as const,
  image: '/coinbase.png',
  link: 'https://docs.cdp.coinbase.com/x402/welcome',
  addresses: {
    [Chain.BASE]: ['0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6'],
  },
  color: 'var(--color-primary)',
};

const x402rsFacilitator: Facilitator = {
  id: 'x402rs',
  name: 'X402rs' as const,
  image: '/x402rs.png',
  link: 'https://x402.rs',
  addresses: {
    [Chain.BASE]: ['0xd8dfc729cbd05381647eb5540d756f4f8ad63eec'],
  },
  color: 'var(--color-orange-600)',
};

const payAiFacilitator: Facilitator = {
  id: 'payAI',
  name: 'PayAI' as const,
  image: '/payai.png',
  link: 'https://payai.network',
  addresses: {
    [Chain.BASE]: ['0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63'],
    [Chain.SOLANA]: [
      '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4' as SolanaAddress,
    ],
  },
  color: 'var(--color-purple-600)',
};

const aurraCloudFacilitator: Facilitator = {
  id: 'aurracloud',
  name: 'AurraCloud' as const,
  image: '/aurracloud.png',
  link: 'https://x402-facilitator.aurracloud.com',
  addresses: {
    [Chain.BASE]: ['0x222c4367a2950f3b53af260e111fc3060b0983ff'],
  },
  color: 'var(--color-yellow-600)',
};

const thirdwebFacilitator: Facilitator = {
  id: 'thirdweb',
  name: 'thirdweb' as const,
  image: '/thirdweb.png',
  link: 'https://portal.thirdweb.com/payments/x402/facilitator',
  addresses: {
    [Chain.BASE]: ['0x80c08de1a05df2bd633cf520754e40fde3c794d3'],
  },
  color: 'var(--color-pink-600)',
};

const corbitsFacilitator: Facilitator = {
  id: 'corbits',
  name: 'Corbits' as const,
  image: '/corbits.png',
  link: 'https://corbits.dev',
  addresses: {
    [Chain.SOLANA]: [
      'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU' as SolanaAddress,
    ],
  },
  color: 'var(--color-orange-600)',
};

const daydreamsFacilitator = {
  id: 'daydreams',
  name: 'Daydreams' as const,
  image: '/router-logo-small.png',
  link: 'https://facilitator.daydreams.systems',
  addresses: {
    [Chain.BASE]: ['0x279e08f711182c79Ba6d09669127a426228a4653'],
    [Chain.SOLANA]: [
      'DuQ4jFMmVABWGxabYHFkGzdyeJgS1hp4wrRuCtsJgT9a' as SolanaAddress,
    ],
  },
  color: 'var(--color-yellow-600)',
} satisfies Facilitator;

const openX402Facilitator: Facilitator = {
  id: 'openx402',
  name: 'Open X402' as const,
  image: '/openx402.png',
  link: 'https://open.x402.host',
  addresses: {
    [Chain.BASE]: ['0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8'],
  },
  color: 'var(--color-blue-600)',
};

export const facilitators: Facilitator[] = [
  coinbaseFacilitator,
  x402rsFacilitator,
  payAiFacilitator,
  aurraCloudFacilitator,
  thirdwebFacilitator,
  corbitsFacilitator,
  daydreamsFacilitator,
  openX402Facilitator,
];

type FacilitatorId = (typeof facilitators)[number]['id'];

export const facilitatorIdMap = new Map<FacilitatorId, Facilitator>(
  facilitators.map(f => [f.id, f])
);

export const facilitatorAddresses = facilitators.flatMap(f =>
  Object.values(f.addresses)
    .flat()
    .map(address => mixedAddressSchema.parse(address))
);
