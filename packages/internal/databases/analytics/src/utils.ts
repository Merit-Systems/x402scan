import { analyticsDb } from './client';
import type { Tables } from './tables/types';
import type { AnalyticsDatabaseMap } from './tables/types';

export const createTable = async (query: string) => {
  return analyticsDb.exec({ query });
};

export const insertData = async <T extends Tables>(
  table: Tables,
  data: AnalyticsDatabaseMap[T][]
) => {
  return analyticsDb.insert<AnalyticsDatabaseMap[T]>({
    table,
    values: data,
    format: 'JSONEachRow',
  });
};
