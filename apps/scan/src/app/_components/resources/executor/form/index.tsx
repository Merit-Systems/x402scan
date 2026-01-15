'use client';

import { useMemo, useState } from 'react';

import { CardContent } from '@/components/ui/card';
import { JsonViewer } from '@/components/ai-elements/json-viewer';

import { ResourceFetch } from '../../../resource-fetch';
import { FieldSection } from './field-section';

import { SUPPORTED_CHAINS } from '@/types/chain';
import type { Methods } from '@/types/x402';
import {
  normalizeChainId,
  type ParsedX402Response,
  type InputSchema,
} from '@/lib/x402';
import {
  extractFieldsFromSchema,
  isValidFieldValue,
  reconstructNestedObject,
} from '@/lib/x402/schema';

import type { SupportedChain } from '@/types/chain';
import type { FieldValue } from '@/types/x402';
import type { X402FetchResponse } from '@/app/_hooks/x402/types';
import type { JsonValue } from '@/components/ai-elements/json-viewer';

interface Props {
  x402Response: ParsedX402Response;
  inputSchema: InputSchema;
  maxAmountRequired: bigint;
  method: Methods;
  resource: string;
}

export function Form({
  x402Response,
  inputSchema,
  maxAmountRequired,
  method,
  resource,
}: Props) {
  const queryFields = useMemo(
    () => extractFieldsFromSchema(inputSchema, method, 'query'),
    [inputSchema, method]
  );

  const bodyFields = useMemo(
    () => extractFieldsFromSchema(inputSchema, method, 'body'),
    [inputSchema, method]
  );

  const [queryValues, setQueryValues] = useState<Record<string, FieldValue>>(
    {}
  );
  const [bodyValues, setBodyValues] = useState<Record<string, FieldValue>>({});

  const handleQueryChange = (name: string, value: FieldValue) => {
    setQueryValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBodyChange = (name: string, value: FieldValue) => {
    setBodyValues(prev => ({ ...prev, [name]: value }));
  };

  const allRequiredFieldsFilled = useMemo(() => {
    const requiredQuery = queryFields.filter(field => field.required);
    const requiredBody = bodyFields.filter(field => field.required);

    const queryFilled = requiredQuery.every(field => {
      const value = queryValues[field.name];
      return value && isValidFieldValue(value);
    });
    const bodyFilled = requiredBody.every(field => {
      const value = bodyValues[field.name];
      return value && isValidFieldValue(value);
    });

    return queryFilled && bodyFilled;
  }, [queryFields, bodyFields, queryValues, bodyValues]);

  const targetUrl = useMemo(() => {
    const queryEntries = Object.entries(queryValues).reduce<[string, string][]>(
      (acc, [key, value]) => {
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            acc.push([key, trimmed]);
          }
        }
        return acc;
      },
      []
    );

    if (queryEntries.length === 0) return resource;
    const searchParams = new URLSearchParams(queryEntries);
    const separator = resource.includes('?') ? '&' : '?';
    return `${resource}${separator}${searchParams.toString()}`;
  }, [resource, queryValues]);

  const requestInit = useMemo((): RequestInit => {
    const bodyEntries = Object.entries(bodyValues).reduce<
      [string, FieldValue | number | boolean][]
    >((acc, [key, value]) => {
      const field = bodyFields.find(f => f.name === key);
      const fieldType = field?.type;

      if (Array.isArray(value)) {
        if (value.length > 0) {
          acc.push([key, value]);
        }
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          if (fieldType === 'number' || fieldType === 'integer') {
            const num = Number(trimmed);
            if (!isNaN(num)) {
              acc.push([key, num]);
            }
          } else if (fieldType === 'boolean') {
            acc.push([key, trimmed === 'true']);
          } else {
            acc.push([key, trimmed]);
          }
        }
      }
      return acc;
    }, []);

    const reconstructedBody = reconstructNestedObject(
      Object.fromEntries(bodyEntries)
    );

    return {
      method,
      body:
        bodyEntries.length > 0 ? JSON.stringify(reconstructedBody) : undefined,
    };
  }, [method, bodyValues, bodyFields]);

  const supportedChains = useMemo(() => {
    const networks = x402Response.accepts?.map(a => a.network ?? '') ?? [];
    const normalized = networks.map(n => normalizeChainId(n));
    return normalized.filter(n =>
      (SUPPORTED_CHAINS as readonly string[]).includes(n)
    ) as SupportedChain[];
  }, [x402Response.accepts]);

  const unsupportedNetworks = useMemo(() => {
    return x402Response.accepts?.map(a => a.network ?? '') ?? [];
  }, [x402Response.accepts]);

  const [data, setData] = useState<X402FetchResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const hasFields = queryFields.length > 0 || bodyFields.length > 0;

  return (
    <CardContent className="flex flex-col gap-4 p-4 border-t">
      {hasFields && (
        <div className="space-y-4">
          <FieldSection
            fields={queryFields}
            values={queryValues}
            onChange={handleQueryChange}
            prefix="query"
          />
          <FieldSection
            fields={bodyFields}
            values={bodyValues}
            onChange={handleBodyChange}
            prefix="body"
            title="Body Parameters"
          />
        </div>
      )}

      {supportedChains.length === 0 ? (
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
          No supported payment networks found.
          {unsupportedNetworks.length > 0 && (
            <span className="block text-xs mt-1">
              Networks in response: {unsupportedNetworks.join(', ')}
            </span>
          )}
        </div>
      ) : (
        <ResourceFetch
          chains={supportedChains}
          allRequiredFieldsFilled={allRequiredFieldsFilled}
          maxAmountRequired={maxAmountRequired}
          targetUrl={targetUrl}
          requestInit={requestInit}
          options={{
            onSuccess: data => setData(data),
            onError: error => setError(error),
          }}
        />
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-3 rounded-md">
          {error.message}
        </p>
      )}

      {data && (
        <pre className="max-h-60 overflow-auto rounded-md bg-muted text-xs">
          {data.type === 'json' ? (
            <JsonViewer data={data.data as JsonValue} />
          ) : (
            <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(data.data, null, 2)}
            </pre>
          )}
        </pre>
      )}
    </CardContent>
  );
}
