import { listResourcesWithPaginationUncached } from '@/services/db/resources/resource';
import type { Prisma } from '../../../../../databases/scan/src';

export async function* iterateResourcesBatched(
  batchSize: number,
  where?: Prisma.ResourcesWhereInput
) {
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { items, hasNextPage } = await listResourcesWithPaginationUncached(
      { where },
      { page, page_size: batchSize }
    );

    console.info('Fetched batch', {
      page,
      itemsCount: items.length,
      hasNextPage,
    });

    if (items.length === 0) {
      break;
    }

    yield items;

    hasMore = hasNextPage;
    page++;
  }
}
