import { partnersDb } from './client';
import type { Tables } from './tables/types';
import type { AnalyticsDatabaseMap } from './tables/types';

export const createTable = async (query: string) => {
  return partnersDb.exec({ query });
};

export const insertData = async <T extends Tables>(
  table: Tables,
  data: AnalyticsDatabaseMap[T][]
) => {
  return partnersDb.insert<AnalyticsDatabaseMap[T]>({
    table,
    values: data,
    format: 'JSONEachRow',
  });
};
