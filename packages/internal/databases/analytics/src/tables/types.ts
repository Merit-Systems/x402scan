import type { InsertResult } from '@clickhouse/client';
import type { ResourceInvocationData } from './resource-invocations';

export enum Tables {
  ResourceInvocations = 'resource_invocations',
}

export type AnalyticsDatabaseMap = {
  [Tables.ResourceInvocations]: ResourceInvocationData;
};

export type InsertDataFunction<T extends Tables> = (
  data: AnalyticsDatabaseMap[T]
) => Promise<InsertResult>;
