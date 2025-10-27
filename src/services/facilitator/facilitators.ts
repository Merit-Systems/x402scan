import { facilitator as baseFacilitator } from '@coinbase/x402';

import type { FacilitatorConfig } from 'x402/types';

const payAiFacilitator: FacilitatorConfig = {
  url: 'https://facilitator.payai.network',
};

const thirdwebFacilitator: FacilitatorConfig = {
  url: 'https://api.thirdweb.com/v1/payments/x402',
};

const aurraCloudFacilitator: FacilitatorConfig = {
  url: 'https://x402-facilitator.aurracloud.com',
};

export const facilitators: FacilitatorConfig[] = [
  baseFacilitator,
  payAiFacilitator,
  thirdwebFacilitator,
  aurraCloudFacilitator,
];
