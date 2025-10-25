import { facilitator as baseFacilitator } from '@coinbase/x402';

import type { FacilitatorConfig } from 'x402/types';

const payAiFacilitator: FacilitatorConfig = {
  url: 'https://facilitator.payai.network',
};

const thirdwebFacilitator: FacilitatorConfig = {
  url: 'https://api.thirdweb.com/v1/payments/x402',
};

const codeNutFacilitator: FacilitatorConfig = {
  url: 'https://pay.codenut.ai/facilitator',
};

export const facilitators: FacilitatorConfig[] = [
  baseFacilitator,
  payAiFacilitator,
  thirdwebFacilitator,
  codeNutFacilitator,
];
