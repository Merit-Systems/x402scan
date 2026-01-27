import { InsertResult } from "@clickhouse/client";
import type { PartnerData } from "./partners";

export enum Tables {
    Partners = 'partners',
}
export interface PartnersDatabaseMap {
    [Tables.Partners]: PartnerData;
}

export type InsertDataFunction<T extends Tables> = (
    data: PartnersDatabaseMap[T]
) => Promise<InsertResult>;