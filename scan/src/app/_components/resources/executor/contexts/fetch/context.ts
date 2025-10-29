import { createContext } from 'react';

import type { FieldDefinition, FieldValue } from '@/types/x402';
import type { X402FetchResponse } from '@/app/_hooks/x402/use-fetch';

interface ResourceFetchContextType {
  queryValues: Record<string, FieldValue>;
  bodyValues: Record<string, FieldValue>;
  queryFields: FieldDefinition[];
  bodyFields: FieldDefinition[];
  handleQueryChange: (name: string, value: FieldValue) => void;
  handleBodyChange: (name: string, value: FieldValue) => void;
  allRequiredFieldsFilled: boolean;
  execute: () => void;
  isPending: boolean;
  error: string | null;
  response: X402FetchResponse<unknown> | undefined;
  maxAmountRequired: bigint;
}

export const ResourceFetchContext = createContext<
  ResourceFetchContextType | undefined
>(undefined);
