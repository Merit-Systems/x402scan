import { FacilitatorConfig } from 'x402/types';
import { allFacilitators } from '../lists/all';

export const discoverableFacilitators = allFacilitators
  .map(f => f.discoveryConfig)
  .filter(Boolean) as FacilitatorConfig[];
