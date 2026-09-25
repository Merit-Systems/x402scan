import { allFacilitators, Network as FacilitatorsNetwork } from "facilitators";

import { mixedAddressSchema } from "./schemas";

import { Chain } from "@/types/chain";

import type { FacilitatorMetadata } from "facilitators";
import type { MixedAddress } from "@/types/address";

// NOTE(shafu): Minimum number of transactions required for a facilitator to be displayed
export const MIN_FACILITATOR_TRANSACTIONS = 100;

export type Facilitator = FacilitatorMetadata & {
  id: string;
  addresses: Partial<Record<Chain, MixedAddress[]>>;
};

const chainMap = {
  [FacilitatorsNetwork.BASE]: Chain.BASE,
  [FacilitatorsNetwork.POLYGON]: Chain.POLYGON,
  [FacilitatorsNetwork.SOLANA]: Chain.SOLANA,
} satisfies Record<FacilitatorsNetwork, Chain>;
const facilitatorNetworks = new Set<string>(Object.values(FacilitatorsNetwork));

function isFacilitatorsNetwork(value: string): value is FacilitatorsNetwork {
  return facilitatorNetworks.has(value);
}

function parseFacilitatorAddress(address: string): MixedAddress | null {
  const parsed = mixedAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : null;
}

export const facilitators: Facilitator[] = allFacilitators.map((f) => ({
  id: f.id,
  ...f.metadata,
  image: `/${f.metadata.image.split("/").pop()}`,
  addresses: Object.entries(f.addresses).reduce<
    Partial<Record<Chain, MixedAddress[]>>
  >((acc, [network, configs]) => {
    if (!isFacilitatorsNetwork(network)) return acc;
    const scanChain = chainMap[network];
    acc[scanChain] = configs.flatMap((c) => {
      const address = parseFacilitatorAddress(c.address);
      return address ? [address] : [];
    });
    return acc;
  }, {}),
}));

type FacilitatorId = (typeof facilitators)[number]["id"];

export const facilitatorIdMap = new Map<FacilitatorId, Facilitator>(
  facilitators.map((f) => [f.id, f])
);

export const facilitatorAddresses = facilitators.flatMap((f) =>
  Object.values(f.addresses).flat()
);
