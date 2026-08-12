import { allFacilitators } from 'facilitators';
import type {
  Facilitator as RawFacilitator,
  FacilitatorAddress,
  Token,
} from 'facilitators';
import { Network as FacilitatorsNetwork } from 'facilitators';
import type { Facilitator, FacilitatorConfig } from '../types';
import { Network } from '../types';

const chainMap = {
  [FacilitatorsNetwork.BASE]: Network.BASE,
  [FacilitatorsNetwork.POLYGON]: Network.POLYGON,
  [FacilitatorsNetwork.SOLANA]: Network.SOLANA,
} satisfies Record<FacilitatorsNetwork, Network>;

function convertAddressConfig(
  facilitatorAddress: FacilitatorAddress
): FacilitatorConfig[] {
  return facilitatorAddress.tokens.map((token: Token) => ({
    address: facilitatorAddress.address,
    token,
    syncStartDate: facilitatorAddress.dateOfFirstTransaction,
    enabled: !facilitatorAddress.deprecated,
  }));
}

function convertFacilitator(raw: RawFacilitator<never>): Facilitator | null {
  if (raw.deprecated) {
    return null;
  }

  const addresses: Partial<Record<Network, FacilitatorConfig[]>> = {};

  for (const [chain, facilitatorAddresses] of Object.entries(raw.addresses)) {
    const mappedChain = chainMap[chain as FacilitatorsNetwork];
    if (mappedChain) {
      const configs = facilitatorAddresses.flatMap(addr =>
        convertAddressConfig(addr)
      );
      if (configs.some(config => config.enabled)) {
        addresses[mappedChain] = configs;
      }
    }
  }

  if (Object.keys(addresses).length === 0) {
    return null;
  }

  return {
    id: raw.id,
    addresses,
  };
}

export const FACILITATORS: Facilitator[] = allFacilitators
  .map(convertFacilitator)
  .filter((f): f is Facilitator => f !== null);

export function FACILITATORS_BY_CHAIN(network: Network): Facilitator[] {
  return FACILITATORS.map(f => ({
    id: f.id,
    addresses: {
      [network]: f.addresses[network] ?? [],
    },
  })).filter(f => f.addresses[network]?.some(config => config.enabled));
}

export const BASE_FACILITATORS = FACILITATORS_BY_CHAIN(Network.BASE);
export const POLYGON_FACILITATORS = FACILITATORS_BY_CHAIN(Network.POLYGON);
export const SOLANA_FACILITATORS = FACILITATORS_BY_CHAIN(Network.SOLANA);
