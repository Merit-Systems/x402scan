import type { InsertResult } from '@clickhouse/client';
import type { ResourceInvocationData } from './resource-invocations';
import type { FacilitatorInvocationData } from './facilitator-invocations';

export enum Tables {
  ResourceInvocations = 'resource_invocations',
  FacilitatorInvocations = 'facilitator_invocations',
}

export interface AnalyticsDatabaseMap {
  [Tables.ResourceInvocations]: ResourceInvocationData;
  [Tables.FacilitatorInvocations]: FacilitatorInvocationData;
}

export type InsertDataFunction<T extends Tables> = (
  data: AnalyticsDatabaseMap[T]
) => Promise<InsertResult>;
