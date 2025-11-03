import { listResourcesWithPagination } from '@/services/db/resources/resource';
import type { Prisma } from '@prisma/client';

export async function* iterateResourcesBatched(
  batchSize: number,
  where?: Prisma.ResourcesWhereInput
) {
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { items, hasNextPage } = await listResourcesWithPagination(
      { page, page_size: batchSize },
      where
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
