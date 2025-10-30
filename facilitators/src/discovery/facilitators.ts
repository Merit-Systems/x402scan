import {
  aurracloudFacilitator,
  coinbaseFacilitator,
  thirdwebFacilitator,
  payaiFacilitator,
} from '../facilitators';

const facilitatorsWithDiscovery = [
  coinbaseFacilitator,
  aurracloudFacilitator,
  thirdwebFacilitator,
  payaiFacilitator,
];

export const discoverableFacilitators = facilitatorsWithDiscovery.map(
  f => f.discoveryConfig
);
