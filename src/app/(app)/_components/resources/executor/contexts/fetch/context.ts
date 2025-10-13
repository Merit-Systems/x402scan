import { createContext } from 'react';

import type { FieldDefinition } from '@/types/x402';

interface ResourceFetchContextType {
  queryValues: Record<string, string>;
  bodyValues: Record<string, string>;
  queryFields: FieldDefinition[];
  bodyFields: FieldDefinition[];
  handleQueryChange: (name: string, value: string) => void;
  handleBodyChange: (name: string, value: string) => void;
  allRequiredFieldsFilled: boolean;
  execute: () => void;
  isPending: boolean;
  error: string | null;
  response: unknown;
  maxAmountRequired: bigint;
}

export const ResourceFetchContext = createContext<
  ResourceFetchContextType | undefined
>(undefined);
