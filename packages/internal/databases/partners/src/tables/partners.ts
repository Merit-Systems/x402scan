import type { InsertDataFunction } from './types';
import { Tables } from './types';
import { insertData } from '../utils';

export const insertPartner: InsertDataFunction<Tables.Partners> = async data =>
  insertData(Tables.Partners, [data]);

export interface PartnerData {
  id: string;
  wallet_address: string | null;
  invite_code: string | null;
  name: string | null;
  email: string | null;
  organization: string | null;
  merit_contact: string | null;
  meeting_date: Date | null;
}
