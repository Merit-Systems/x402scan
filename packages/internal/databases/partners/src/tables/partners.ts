import type { InsertDataFunction } from './types';
import { Tables } from './types';
import { createTable, insertData } from '../utils';

const partnersTable = `
    CREATE TABLE IF NOT EXISTS ${Tables.Partners} (
      id String,
      name String,
      email String,
      organization String,
      merit_contact String,
      meeting_date Array(DateTime64(3)),
      wallet_addresses Array(String),
      invite_codes Array(String)
    ) ENGINE = MergeTree()
    ORDER BY (id)
    SETTINGS index_granularity = 8192;
`;

export const createPartnersTable = async () => {
  return createTable(partnersTable);
};

export const insertPartner: InsertDataFunction<Tables.Partners> = async data =>
  insertData(Tables.Partners, [data]);

export interface PartnerData {
  id: string;
  name: string;
  email: string;
  organization: string;
  merit_contact: string;
  meeting_date: Date[];
  wallet_addresses: string[];
  invite_codes: string[];
}
