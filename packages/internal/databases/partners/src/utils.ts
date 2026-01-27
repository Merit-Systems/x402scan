import { partnersDb } from './client';
import type { Tables } from './tables/types';
import type { PartnersDatabaseMap } from './tables/types';

export const createTable = async (query: string) => {
  return partnersDb.exec({ query });
};

export const insertData = async <T extends Tables>(
  table: Tables,
  data: PartnersDatabaseMap[T][]
) => {
  return partnersDb.insert<PartnersDatabaseMap[T]>({
    table,
    values: data,
    format: 'JSONEachRow',
  });
};
