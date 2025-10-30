import { useFacilitator as facilitatorUtils } from 'x402/verify';

import type {
  FacilitatorConfig,
  ListDiscoveryResourcesRequest,
} from 'x402/types';

type FacilitatorResource = Awaited<
  ReturnType<typeof listFacilitatorResources>
>['items'][number];

export const listFacilitatorResources = async (
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
  let backoff = 1000;
  const maxBackoff = 32000;
  while (hasMore) {
    try {
      const { pagination, items } = await listFacilitatorResources(
        facilitator,
        {
          offset,
          limit: 100,
        }
      );
      allItems.push(...items);

      if (pagination.total > pagination.offset + pagination.limit) {
        hasMore = true;
        offset += pagination.limit;
      } else {
        hasMore = false;
      }
      backoff = 1000;
    } catch (err) {
      const isRateLimit =
        err instanceof Error && err.message.toLowerCase().includes('429');

      if (isRateLimit) {
        console.log('Rate limit hit, retrying in', backoff, 'ms');

        await new Promise(res => setTimeout(res, backoff));
        backoff = Math.min(backoff * 2, maxBackoff);
        continue;
      } else {
        throw err;
      }
    }
  }
  return allItems;
};
