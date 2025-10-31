import {
  aurracloudFacilitator,
  coinbaseFacilitator,
  thirdwebFacilitator,
  x402rsFacilitator,
  payaiFacilitator,
  corbitsFacilitator,
  dexterFacilitator,
  daydreamsFacilitator,
  mogamiFacilitator,
  openx402Facilitator,
  f402104Facilitator,
  ainalystFacilitator,
} from '../facilitators';

import { validateUniqueFacilitators } from './validate';

import type { Facilitator } from '../types';

const FACILITATORS = validateUniqueFacilitators([
  coinbaseFacilitator,
  aurracloudFacilitator,
  thirdwebFacilitator,
  x402rsFacilitator,
  payaiFacilitator,
  corbitsFacilitator,
  dexterFacilitator,
  daydreamsFacilitator,
  mogamiFacilitator,
  openx402Facilitator,
  f402104Facilitator,
  ainalystFacilitator,
]);

export const allFacilitators: Facilitator[] =
  FACILITATORS as unknown as Facilitator[];
