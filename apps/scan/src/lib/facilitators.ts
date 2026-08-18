import { allFacilitators, Network as FacilitatorsNetwork } from 'facilitators';

import { mixedAddressSchema } from './schemas';

import { Chain } from '@/types/chain';

import type { FacilitatorMetadata } from 'facilitators';
import type { MixedAddress } from '@/types/address';

// NOTE(shafu): Minimum number of transactions required for a facilitator to be displayed
export const MIN_FACILITATOR_TRANSACTIONS = 100;

export type Facilitator = FacilitatorMetadata & {
  id: string;
  addresses: Partial<Record<Chain, MixedAddress[]>>;
};

// Networks in the facilitators registry that scan does not index yet
// (e.g. Network.CELO) are skipped until a chain sync source exists.
const chainMap = {
  [FacilitatorsNetwork.BASE]: Chain.BASE,
  [FacilitatorsNetwork.POLYGON]: Chain.POLYGON,
  [FacilitatorsNetwork.SOLANA]: Chain.SOLANA,
} satisfies Partial<Record<FacilitatorsNetwork, Chain>>;

function parseFacilitatorAddress(address: string): MixedAddress | null {
  const parsed = mixedAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : null;
}

export const facilitators: Facilitator[] = allFacilitators.map(f => ({
  id: f.id,
  ...f.metadata,
  image: `/${f.metadata.image.split('/').pop()}`,
  addresses: Object.entries(f.addresses).reduce<
    Partial<Record<Chain, MixedAddress[]>>
  >((acc, [network, configs]) => {
    const scanChain = chainMap[network as keyof typeof chainMap];
    if (scanChain) {
      acc[scanChain] = configs.flatMap(c => {
        const address = parseFacilitatorAddress(c.address);
        return address ? [address] : [];
      });
    }
    return acc;
  }, {}),
}));

type FacilitatorId = (typeof facilitators)[number]['id'];

export const facilitatorIdMap = new Map<FacilitatorId, Facilitator>(
  facilitators.map(f => [f.id, f])
);

export const facilitatorAddresses = facilitators.flatMap(f =>
  Object.values(f.addresses).flat()
);
