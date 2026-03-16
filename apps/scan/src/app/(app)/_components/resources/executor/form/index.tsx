'use client';

import { useEffect, useMemo, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { CardContent } from '@/components/ui/card';
import { JsonViewer } from '@/components/ai-elements/json-viewer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
import type { FieldDefinition, FieldValue } from '@/types/x402';
import type { X402FetchResponse } from '@/app/(app)/_hooks/x402/types';
import type { JsonValue } from '@/components/ai-elements/json-viewer';
import type { ResourceRequestMetadata } from '@x402scan/scan-db';

function splitByRequired(fields: FieldDefinition[]) {
  const required = fields.filter(f => f.required);
  const optional = fields.filter(f => !f.required);
  return { required, optional };
}

function extractDefaults(metadata: Record<string, unknown> | null | undefined): Record<string, FieldValue> {
  if (!metadata || typeof metadata !== 'object') return {};
  const defaults: Record<string, FieldValue> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      defaults[key] = value;
    } else if (Array.isArray(value)) {
      defaults[key] = value;
    }
  }
  return defaults;
}

interface Props {
  x402Response: ParsedX402Response;
  inputSchema: InputSchema;
  maxAmountRequired: bigint;
  method: Methods;
  resource: string;
  requestMetadata?: ResourceRequestMetadata;
}

export function Form({
  x402Response,
  inputSchema,
  maxAmountRequired,
  method,
  resource,
  requestMetadata,
}: Props) {
  const headerFields = useMemo(
    () => extractFieldsFromSchema(inputSchema, method, 'header'),
    [inputSchema, method]
  );

  const queryFields = useMemo(
    () => extractFieldsFromSchema(inputSchema, method, 'query'),
    [inputSchema, method]
  );

  const bodyFields = useMemo(
    () => extractFieldsFromSchema(inputSchema, method, 'body'),
    [inputSchema, method]
  );

  const headerDefaults = useMemo(
    () => extractDefaults(requestMetadata?.headers as Record<string, unknown> | null),
    [requestMetadata]
  );
  const queryDefaults = useMemo(
    () => extractDefaults(requestMetadata?.queryParams as Record<string, unknown> | null),
    [requestMetadata]
  );
  const bodyDefaults = useMemo(
    () => extractDefaults(requestMetadata?.body as Record<string, unknown> | null),
    [requestMetadata]
  );

  const [headerValues, setHeaderValues] = useState<Record<string, FieldValue>>(
    () => ({ ...headerDefaults })
  );
  const [queryValues, setQueryValues] = useState<Record<string, FieldValue>>(
    () => ({ ...queryDefaults })
  );
  const [bodyValues, setBodyValues] = useState<Record<string, FieldValue>>(
    () => ({ ...bodyDefaults })
  );

  useEffect(() => {
    setHeaderValues(prev => ({ ...prev, ...headerDefaults }));
  }, [headerDefaults]);
  useEffect(() => {
    setQueryValues(prev => ({ ...prev, ...queryDefaults }));
  }, [queryDefaults]);
  useEffect(() => {
    setBodyValues(prev => ({ ...prev, ...bodyDefaults }));
  }, [bodyDefaults]);

  const handleHeaderChange = (name: string, value: FieldValue) => {
    setHeaderValues(prev => ({ ...prev, [name]: value }));
  };

  const handleQueryChange = (name: string, value: FieldValue) => {
    setQueryValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBodyChange = (name: string, value: FieldValue) => {
    setBodyValues(prev => ({ ...prev, [name]: value }));
  };

  const allRequiredFieldsFilled = useMemo(() => {
    const requiredHeader = headerFields.filter(field => field.required);
    const requiredQuery = queryFields.filter(field => field.required);
    const requiredBody = bodyFields.filter(field => field.required);

    const headerFilled = requiredHeader.every(field => {
      const value = headerValues[field.name];
      return value && isValidFieldValue(value);
    });
    const queryFilled = requiredQuery.every(field => {
      const value = queryValues[field.name];
      return value && isValidFieldValue(value);
    });
    const bodyFilled = requiredBody.every(field => {
      const value = bodyValues[field.name];
      return value && isValidFieldValue(value);
    });

    return headerFilled && queryFilled && bodyFilled;
  }, [
    headerFields,
    queryFields,
    bodyFields,
    headerValues,
    queryValues,
    bodyValues,
  ]);

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

  const isReservedHeader = (name: string) =>
    name.trim().toLowerCase() === 'x-payment';

  const headerEntries = useMemo(() => {
    return Object.entries(headerValues).reduce<[string, string][]>(
      (acc, [key, value]) => {
        if (isReservedHeader(key)) return acc;
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
  }, [headerValues]);

  const bodyEntries = useMemo(() => {
    return Object.entries(bodyValues).reduce<
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
  }, [bodyValues, bodyFields]);

  const requestInit = useMemo((): RequestInit => {
    const reconstructedBody = reconstructNestedObject(
      Object.fromEntries(bodyEntries)
    );

    const headers = new Headers();
    for (const [k, v] of headerEntries) headers.set(k, v);

    return {
      method,
      headers: headerEntries.length > 0 ? headers : undefined,
      body:
        bodyEntries.length > 0 ? JSON.stringify(reconstructedBody) : undefined,
    };
  }, [method, headerEntries, bodyEntries]);

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

  const headerSplit = useMemo(() => splitByRequired(headerFields), [headerFields]);
  const querySplit = useMemo(() => splitByRequired(queryFields), [queryFields]);
  const bodySplit = useMemo(() => splitByRequired(bodyFields), [bodyFields]);

  const allRequired = [
    ...headerSplit.required,
    ...querySplit.required,
    ...bodySplit.required,
  ];
  const allOptional = [
    ...headerSplit.optional,
    ...querySplit.optional,
    ...bodySplit.optional,
  ];

  const requiredCategoryCount = [
    headerSplit.required.length > 0,
    querySplit.required.length > 0,
    bodySplit.required.length > 0,
  ].filter(Boolean).length;

  const hasFields =
    headerFields.length > 0 || queryFields.length > 0 || bodyFields.length > 0;

  return (
    <CardContent className="flex flex-col gap-4 p-4 border-t">
      {hasFields && (
        <div className="space-y-4">
          {/* Required parameters shown first */}
          <FieldSection
            fields={headerSplit.required}
            values={headerValues}
            onChange={handleHeaderChange}
            prefix="header"
            title={headerSplit.required.length > 0 && requiredCategoryCount > 1 ? "Required Header Parameters" : undefined}
            defaults={headerDefaults}
          />
          <FieldSection
            fields={querySplit.required}
            values={queryValues}
            onChange={handleQueryChange}
            prefix="query"
            title={querySplit.required.length > 0 && requiredCategoryCount > 1 ? "Required Query Parameters" : undefined}
            defaults={queryDefaults}
          />
          <FieldSection
            fields={bodySplit.required}
            values={bodyValues}
            onChange={handleBodyChange}
            prefix="body"
            title={bodySplit.required.length > 0 && requiredCategoryCount > 1 ? "Required Body Parameters" : undefined}
            defaults={bodyDefaults}
          />

          {/* Optional parameters in a collapsible section */}
          {allOptional.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full group">
                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                <span>Optional parameters ({allOptional.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-4">
                <FieldSection
                  fields={headerSplit.optional}
                  values={headerValues}
                  onChange={handleHeaderChange}
                  prefix="header"
                  title={headerSplit.optional.length > 0 && allOptional.length > headerSplit.optional.length ? "Header Parameters" : undefined}
                  defaults={headerDefaults}
                />
                <FieldSection
                  fields={querySplit.optional}
                  values={queryValues}
                  onChange={handleQueryChange}
                  prefix="query"
                  title={querySplit.optional.length > 0 && allOptional.length > querySplit.optional.length ? "Query Parameters" : undefined}
                  defaults={queryDefaults}
                />
                <FieldSection
                  fields={bodySplit.optional}
                  values={bodyValues}
                  onChange={handleBodyChange}
                  prefix="body"
                  title={bodySplit.optional.length > 0 && allOptional.length > bodySplit.optional.length ? "Body Parameters" : undefined}
                  defaults={bodyDefaults}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
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
