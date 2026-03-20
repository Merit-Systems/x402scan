'use client';

import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import type { ResourceRequestMetadata } from '@x402scan/scan-db';
import type { X402FetchResponse } from '@/app/(app)/_hooks/x402/types';
import type { JsonValue } from '@/components/ai-elements/json-viewer';

interface Props {
  x402Response: ParsedX402Response;
  inputSchema: InputSchema;
  maxAmountRequired: bigint;
  method: Methods;
  resource: string;
  requestMetadata?: ResourceRequestMetadata | null;
}

interface OptionalFieldSectionProps {
  title: string;
  fields: FieldDefinition[];
  values: Record<string, FieldValue>;
  onChange: (name: string, value: FieldValue) => void;
  prefix: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function flattenMetadataValues(
  value: unknown,
  prefix = ''
): Record<string, FieldValue> {
  const result: Record<string, FieldValue> = {};

  if (Array.isArray(value)) {
    if (prefix) {
      result[prefix] = value;
    }
    return result;
  }

  if (!isPlainObject(value)) {
    if (prefix && (typeof value === 'string' || typeof value === 'number')) {
      result[prefix] = String(value);
    }
    if (prefix && typeof value === 'boolean') {
      result[prefix] = value ? 'true' : 'false';
    }
    return result;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPrefix = prefix ? `${prefix}.${key}` : key;
    Object.assign(result, flattenMetadataValues(nestedValue, nestedPrefix));
  }

  return result;
}

function mergeInputSchemaWithMetadata(
  baseInputSchema: InputSchema,
  metadata: ResourceRequestMetadata | null | undefined
): InputSchema {
  if (!isPlainObject(metadata?.inputSchema)) {
    return baseInputSchema;
  }

  const merged = {
    ...(baseInputSchema as Record<string, unknown>),
  };

  for (const [key, value] of Object.entries(metadata.inputSchema)) {
    const existingValue = merged[key];
    if (isPlainObject(existingValue) && isPlainObject(value)) {
      merged[key] = { ...existingValue, ...value };
      continue;
    }
    merged[key] = value;
  }

  return merged as InputSchema;
}

function splitRequiredFields(fields: FieldDefinition[]) {
  return {
    required: fields.filter(field => field.required),
    optional: fields.filter(field => !field.required),
  };
}

function buildInitialFieldValues(
  fields: FieldDefinition[],
  metadataDefaults: Record<string, FieldValue>
): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};

  for (const field of fields) {
    const metadataValue = metadataDefaults[field.name];

    if (field.type === 'array') {
      if (Array.isArray(metadataValue)) {
        values[field.name] = metadataValue;
      }
      continue;
    }

    if (typeof metadataValue === 'string') {
      values[field.name] = metadataValue;
      continue;
    }

    if (typeof field.default === 'string') {
      values[field.name] = field.default;
    }
  }

  return values;
}

function OptionalFieldSection({
  title,
  fields,
  values,
  onChange,
  prefix,
}: OptionalFieldSectionProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <Collapsible className="group rounded-md border">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {title} ({fields.length})
          </span>
          <ChevronDown className="size-3 text-muted-foreground transition-transform group-open:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        <FieldSection
          fields={fields}
          values={values}
          onChange={onChange}
          prefix={prefix}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Form({
  x402Response,
  inputSchema,
  maxAmountRequired,
  method,
  resource,
  requestMetadata,
}: Props) {
  const mergedInputSchema = useMemo(
    () => mergeInputSchemaWithMetadata(inputSchema, requestMetadata),
    [inputSchema, requestMetadata]
  );

  const headerFields = useMemo(
    () => extractFieldsFromSchema(mergedInputSchema, method, 'header'),
    [mergedInputSchema, method]
  );

  const queryFields = useMemo(
    () => extractFieldsFromSchema(mergedInputSchema, method, 'query'),
    [mergedInputSchema, method]
  );

  const bodyFields = useMemo(
    () => extractFieldsFromSchema(mergedInputSchema, method, 'body'),
    [mergedInputSchema, method]
  );

  const headerDefaults = useMemo(
    () => flattenMetadataValues(requestMetadata?.headers),
    [requestMetadata?.headers]
  );
  const queryDefaults = useMemo(
    () => flattenMetadataValues(requestMetadata?.queryParams),
    [requestMetadata?.queryParams]
  );
  const bodyDefaults = useMemo(
    () => flattenMetadataValues(requestMetadata?.body),
    [requestMetadata?.body]
  );

  const initialHeaderValues = useMemo(
    () => buildInitialFieldValues(headerFields, headerDefaults),
    [headerFields, headerDefaults]
  );
  const initialQueryValues = useMemo(
    () => buildInitialFieldValues(queryFields, queryDefaults),
    [queryFields, queryDefaults]
  );
  const initialBodyValues = useMemo(
    () => buildInitialFieldValues(bodyFields, bodyDefaults),
    [bodyFields, bodyDefaults]
  );

  const [headerValues, setHeaderValues] = useState<Record<string, FieldValue>>(
    initialHeaderValues
  );
  const [queryValues, setQueryValues] = useState<Record<string, FieldValue>>(
    initialQueryValues
  );
  const [bodyValues, setBodyValues] = useState<Record<string, FieldValue>>(
    initialBodyValues
  );

  const handleHeaderChange = (name: string, value: FieldValue) => {
    setHeaderValues(prev => ({ ...prev, [name]: value }));
  };

  const handleQueryChange = (name: string, value: FieldValue) => {
    setQueryValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBodyChange = (name: string, value: FieldValue) => {
    setBodyValues(prev => ({ ...prev, [name]: value }));
  };

  const { required: requiredHeaderFields, optional: optionalHeaderFields } =
    useMemo(() => splitRequiredFields(headerFields), [headerFields]);
  const { required: requiredQueryFields, optional: optionalQueryFields } =
    useMemo(() => splitRequiredFields(queryFields), [queryFields]);
  const { required: requiredBodyFields, optional: optionalBodyFields } =
    useMemo(() => splitRequiredFields(bodyFields), [bodyFields]);

  const allRequiredFieldsFilled = useMemo(() => {
    const headerFilled = requiredHeaderFields.every(field => {
      const value = headerValues[field.name];
      return value !== undefined && isValidFieldValue(value);
    });
    const queryFilled = requiredQueryFields.every(field => {
      const value = queryValues[field.name];
      return value !== undefined && isValidFieldValue(value);
    });
    const bodyFilled = requiredBodyFields.every(field => {
      const value = bodyValues[field.name];
      return value !== undefined && isValidFieldValue(value);
    });

    return headerFilled && queryFilled && bodyFilled;
  }, [
    requiredHeaderFields,
    requiredQueryFields,
    requiredBodyFields,
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

  const hasFields =
    headerFields.length > 0 || queryFields.length > 0 || bodyFields.length > 0;

  const hasRequiredFields =
    requiredHeaderFields.length > 0 ||
    requiredQueryFields.length > 0 ||
    requiredBodyFields.length > 0;

  return (
    <CardContent className="flex flex-col gap-4 p-4 border-t">
      {hasFields && (
        <div className="space-y-4">
          {hasRequiredFields && (
            <div className="space-y-4 rounded-md border bg-muted/30 p-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Required Parameters</h3>
                <p className="text-xs text-muted-foreground">
                  Fill these first to enable request execution.
                </p>
              </div>
              <FieldSection
                fields={requiredHeaderFields}
                values={headerValues}
                onChange={handleHeaderChange}
                prefix="required-header"
                title={
                  requiredHeaderFields.length > 0
                    ? 'Header Parameters'
                    : undefined
                }
              />
              <FieldSection
                fields={requiredQueryFields}
                values={queryValues}
                onChange={handleQueryChange}
                prefix="required-query"
                title={
                  requiredQueryFields.length > 0
                    ? 'Query Parameters'
                    : undefined
                }
              />
              <FieldSection
                fields={requiredBodyFields}
                values={bodyValues}
                onChange={handleBodyChange}
                prefix="required-body"
                title={
                  requiredBodyFields.length > 0 ? 'Body Parameters' : undefined
                }
              />
            </div>
          )}

          <OptionalFieldSection
            title="Optional Header Parameters"
            fields={optionalHeaderFields}
            values={headerValues}
            onChange={handleHeaderChange}
            prefix="optional-header"
          />
          <OptionalFieldSection
            title="Optional Query Parameters"
            fields={optionalQueryFields}
            values={queryValues}
            onChange={handleQueryChange}
            prefix="optional-query"
          />
          <OptionalFieldSection
            title="Optional Body Parameters"
            fields={optionalBodyFields}
            values={bodyValues}
            onChange={handleBodyChange}
            prefix="optional-body"
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
