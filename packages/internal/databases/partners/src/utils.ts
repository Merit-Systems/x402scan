import { partnersDb } from './client';
import type { Tables } from './tables';
import type { PartnersDatabaseMap } from './tables';

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
