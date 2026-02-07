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
  questflowFacilitator,
  xechoFacilitator,
  codenutFacilitator,
  ultravioletadaoFacilitator,
  virtualsFacilitator,
  heuristFacilitator,
  treasureFacilitator,
  anyspendFacilitator,
  polymerFacilitator,
  meridianFacilitator,
  openmidFacilitator,
  primerFacilitator,
  x402jobsFacilitator,
  openfacilitatorFacilitator,
  primevFacilitator,
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
  heuristFacilitator,
  treasureFacilitator,
  anyspendFacilitator,
  polymerFacilitator,
  meridianFacilitator,
  openmidFacilitator,
  primerFacilitator,
  x402jobsFacilitator,
  openfacilitatorFacilitator,
  primevFacilitator,
]);

export const allFacilitators: Facilitator[] =
  FACILITATORS as unknown as Facilitator[];
