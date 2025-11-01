import {
  anyspendFacilitator,
  aurracloudFacilitator,
  codenutFacilitator,
  coinbaseFacilitator,
  corbitsFacilitator,
  daydreamsFacilitator,
  dexterFacilitator,
  f402104Facilitator,
  mogamiFacilitator,
  openx402Facilitator,
  payaiFacilitator,
  questflowFacilitator,
  thirdwebFacilitator,
  ultravioletadaoFacilitator,
  virtualsFacilitator,
  x402rsFacilitator,
  xechoFacilitator,
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
  questflowFacilitator,
  xechoFacilitator,
  codenutFacilitator,
  ultravioletadaoFacilitator,
  virtualsFacilitator,
  anyspendFacilitator,
]);

export const allFacilitators: Facilitator[] =
  FACILITATORS as unknown as Facilitator[];
