import { Network } from '../types';
import { allFacilitators } from './all';

const getFacilitatorsByNetwork = function (network: Network) {
  return allFacilitators.filter(f => f.addresses[network]);
};

export const baseFacilitators = getFacilitatorsByNetwork(Network.BASE);
export const polygonFacilitators = getFacilitatorsByNetwork(Network.POLYGON);
export const solanaFacilitators = getFacilitatorsByNetwork(Network.SOLANA);
