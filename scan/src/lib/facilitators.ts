import { allFacilitators } from 'facilitators/lists';
import { Network as FacilitatorsNetwork } from 'facilitators/types';

import { mixedAddressSchema } from './schemas';

import { Chain } from '@/types/chain';

import type { FacilitatorMetadata } from 'facilitators/types';
import type { MixedAddress } from '@/types/address';

export type Facilitator = FacilitatorMetadata & {
  id: string;
  addresses: Partial<Record<Chain, MixedAddress[]>>;
};

const chainMap: Record<FacilitatorsNetwork, Chain> = {
  [FacilitatorsNetwork.BASE]: Chain.BASE,
  [FacilitatorsNetwork.POLYGON]: Chain.POLYGON,
  [FacilitatorsNetwork.SOLANA]: Chain.SOLANA,
};

export const facilitators: Facilitator[] = allFacilitators.map(f => ({
  id: f.id,
  ...f.metadata,
  image: `/${f.metadata.image.split('/').pop()}`,
  addresses: Object.entries(f.addresses).reduce(
    (acc, [network, configs]) => {
      const scanChain = chainMap[network as FacilitatorsNetwork];
      acc[scanChain] = configs.map(c => c.address as MixedAddress);
      return acc;
    },
    {} as Partial<Record<Chain, MixedAddress[]>>
  ),
}));

type FacilitatorId = (typeof facilitators)[number]['id'];

export const facilitatorIdMap = new Map<FacilitatorId, Facilitator>(
  facilitators.map(f => [f.id, f])
);

export const facilitatorAddresses = facilitators.flatMap(f =>
  Object.values(f.addresses)
    .flat()
    .map(address => mixedAddressSchema.parse(address))
);
