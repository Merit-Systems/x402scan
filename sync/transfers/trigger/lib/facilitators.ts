import { allFacilitators } from 'facilitators';
import type {
  Facilitator as RawFacilitator,
  FacilitatorAddress,
  Token,
} from 'facilitators';
import { Network as FacilitatorsNetwork } from 'facilitators';
import { Facilitator, FacilitatorConfig, Network } from '../types';

const chainMap: Record<FacilitatorsNetwork, Network> = {
  [FacilitatorsNetwork.BASE]: Network.BASE,
  [FacilitatorsNetwork.POLYGON]: Network.POLYGON,
  [FacilitatorsNetwork.SOLANA]: Network.SOLANA,
};

function convertAddressConfig(
  facilitatorAddress: FacilitatorAddress
): FacilitatorConfig[] {
  return facilitatorAddress.tokens.map((token: Token) => ({
    address: facilitatorAddress.address,
    token,
    syncStartDate: facilitatorAddress.dateOfFirstTransaction,
    enabled: true,
  }));
}

function convertFacilitator(raw: RawFacilitator): Facilitator | null {
  const addresses: Partial<Record<Network, FacilitatorConfig[]>> = {};

  for (const [chain, facilitatorAddresses] of Object.entries(raw.addresses)) {
    const mappedChain = chainMap[chain as FacilitatorsNetwork];
    if (mappedChain) {
      const configs = facilitatorAddresses.flatMap(addr =>
        convertAddressConfig(addr)
      );
      if (configs.length > 0) {
        addresses[mappedChain] = configs;
      }
    }
  }

  // NOTE(shafu): Only include facilitator if it has at least one address configured for sync
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
      [network]: f.addresses[network] || [],
    },
  })).filter(f => f.addresses[network]?.length);
}
