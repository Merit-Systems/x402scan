import 'server-only';

import type {
  FacilitatorConfig,
  ListDiscoveryResourcesRequest,
} from 'x402/types';
import { useFacilitator as facilitatorUtils } from 'x402/verify';

type FacilitatorResource = Awaited<
  ReturnType<typeof listFacilitatorResources>
>['items'][number];

const listFacilitatorResources = async (
  facilitator: FacilitatorConfig,
  config?: ListDiscoveryResourcesRequest
) => {
  return await facilitatorUtils(facilitator).list(config);
};

export const listAllFacilitatorResources = async (
  facilitator: FacilitatorConfig
) => {
  let hasMore = true;
  let offset = 0;
  const allItems: FacilitatorResource[] = [];
  while (hasMore) {
    const { pagination, items } = await listFacilitatorResources(facilitator, {
      offset,
      limit: 100,
    });
    allItems.push(...items);
    if (pagination.total > pagination.offset + pagination.limit) {
      hasMore = true;
      offset += pagination.limit;
    } else {
      hasMore = false;
    }
  }
  return allItems;
};
