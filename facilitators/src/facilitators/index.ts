import { Chain, Facilitator } from '../types';
import { validateUniqueFacilitators } from '../lib/validate';

// Import all facilitators
export { coinbase } from './coinbase';
export { aurracloud } from './aurracloud';
export { thirdweb } from './thirdweb';
export { x402rs } from './x402rs';
export { payai } from './payai';
export { corbits } from './corbits';
export { dexter } from './dexter';
export { daydreams } from './daydreams';
export { mogami } from './mogami';
export { openx402 } from './openx402';
export { f402104 } from './402104';

import { coinbase } from './coinbase';
import { aurracloud } from './aurracloud';
import { thirdweb } from './thirdweb';
import { x402rs } from './x402rs';
import { payai } from './payai';
import { corbits } from './corbits';
import { dexter } from './dexter';
import { daydreams } from './daydreams';
import { mogami } from './mogami';
import { openx402 } from './openx402';
import { f402104 } from './402104';

// Combine all facilitators into an array
const _FACILITATORS = validateUniqueFacilitators([
  coinbase,
  aurracloud,
  thirdweb,
  x402rs,
  payai,
  corbits,
  dexter,
  daydreams,
  mogami,
  openx402,
  f402104,
]);

export const FACILITATORS: Facilitator[] =
  _FACILITATORS as unknown as Facilitator[];

export const DISCOVERABLE_FACILITATORS = FACILITATORS.filter(
  f => !!f.discoveryConfig
);

export const FACILITATORS_BY_CHAIN = function (chain: Chain) {
  return FACILITATORS.filter(f => f.addresses[chain]);
};

export const BASE_FACILITATORS = FACILITATORS_BY_CHAIN(Chain.BASE);
export const POLYGON_FACILITATORS = FACILITATORS_BY_CHAIN(Chain.POLYGON);
export const SOLANA_FACILITATORS = FACILITATORS_BY_CHAIN(Chain.SOLANA);
