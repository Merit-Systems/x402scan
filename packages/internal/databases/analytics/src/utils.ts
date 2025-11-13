import { createAnalyticsDb } from './client';
import type { Tables } from './tables/types';
import type { AnalyticsDatabaseMap } from './tables/types';

export const createTable = async (query: string) => {
  return createAnalyticsDb().exec({ query });
};

export const insertData = async <T extends Tables>(
  table: Tables,
  data: AnalyticsDatabaseMap[T][]
) => {
  return createAnalyticsDb().insert<AnalyticsDatabaseMap[T]>({
    table,
    values: data,
    format: 'JSONEachRow',
  });
};
