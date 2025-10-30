import { allFacilitators } from '../lists/all';

import type { FacilitatorConfig } from 'x402/types';

export const discoverableFacilitators = allFacilitators
  .map(f => f.discoveryConfig)
  .filter(Boolean) as FacilitatorConfig[];
