import { FACILITATORS as RAW_FACILITATORS } from '@facilitators/src/facilitators';
import type {
  Facilitator as RawFacilitator,
  FacilitatorAddress,
  Token,
} from '@facilitators/src/types';
import { Chain as FacilitatorsChain } from '@facilitators/src/types';
import type { Facilitator, FacilitatorConfig, Chain } from '../types';
import { getSyncStartDate } from '../config';

const chainMap: Record<FacilitatorsChain, Chain> = {
  [FacilitatorsChain.BASE]: FacilitatorsChain.BASE,
  [FacilitatorsChain.POLYGON]: FacilitatorsChain.POLYGON,
  [FacilitatorsChain.SOLANA]: FacilitatorsChain.SOLANA,
};

function convertAddressConfig(
  facilitatorAddress: FacilitatorAddress,
  chain: Chain
): FacilitatorConfig[] {
  return facilitatorAddress.tokens.map((token: Token) => ({
    address: facilitatorAddress.address,
    token,
    syncStartDate: getSyncStartDate(chain, facilitatorAddress.address),
    enabled: true,
  }));
}

function convertFacilitator(raw: RawFacilitator): Facilitator {
  const addresses: Partial<Record<Chain, FacilitatorConfig[]>> = {};

  for (const [chain, facilitatorAddresses] of Object.entries(raw.addresses)) {
    const mappedChain = chainMap[chain as FacilitatorsChain];
    if (mappedChain) {
      addresses[mappedChain] = facilitatorAddresses.flatMap(addr =>
        convertAddressConfig(addr, mappedChain)
      );
    }
  }

  return {
    id: raw.id,
    addresses,
  };
}

export const FACILITATORS: Facilitator[] =
  RAW_FACILITATORS.map(convertFacilitator);

export function FACILITATORS_BY_CHAIN(chain: Chain): Facilitator[] {
  return FACILITATORS.map(f => ({
    id: f.id,
    addresses: {
      [chain]: f.addresses[chain] || [],
    },
  })).filter(f => f.addresses[chain]?.length);
}

export const BASE_FACILITATORS = FACILITATORS_BY_CHAIN(FacilitatorsChain.BASE);
export const POLYGON_FACILITATORS = FACILITATORS_BY_CHAIN(
  FacilitatorsChain.POLYGON
);
export const SOLANA_FACILITATORS = FACILITATORS_BY_CHAIN(
  FacilitatorsChain.SOLANA
);
