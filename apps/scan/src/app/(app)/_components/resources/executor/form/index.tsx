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
import type { X402FetchResponse } from '@/app/(app)/_hooks/x402/types';
import type { JsonValue } from '@/components/ai-elements/json-viewer';
import type { ResourceRequestMetadata } from '@x402scan/scan-db';

interface Props {
  x402Response: ParsedX402Response;
  inputSchema: InputSchema;
  maxAmountRequired: bigint;
  method: Methods;
  resource: string;
  requestMetadata?: ResourceRequestMetadata | null;
}

function toRecord(
  value: unknown
): Record<string, unknown> | Record<string, never> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function getNestedValue(
  record: Record<string, unknown>,
  path: string
): unknown | undefined {
  const directValue = record[path];
  if (directValue !== undefined) {
    return directValue;
  }

  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, record);
}

function normalizeDefaultValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function resolveFieldMetadata(
  metadata: Record<string, unknown>,
  fieldName: string
): Partial<{
  type: string;
  description: string;
  required: boolean;
  enum: string[];
  default: string;
}> {
  const fieldMetadata = getNestedValue(metadata, fieldName);
  if (fieldMetadata === undefined) {
    return {};
  }

  if (
    fieldMetadata &&
    typeof fieldMetadata === 'object' &&
    !Array.isArray(fieldMetadata)
  ) {
    const raw = fieldMetadata as Record<string, unknown>;
    return {
      type: typeof raw.type === 'string' ? raw.type : undefined,
      description:
        typeof raw.description === 'string' ? raw.description : undefined,
      required: typeof raw.required === 'boolean' ? raw.required : undefined,
      enum:
        Array.isArray(raw.enum) &&
        raw.enum.every(option => typeof option === 'string')
          ? (raw.enum as string[])
          : undefined,
      default: normalizeDefaultValue(raw.default),
    };
  }

  return {
    default: normalizeDefaultValue(fieldMetadata),
  };
}

function createMetadataOnlyField(
  fieldName: string,
  metadataValue: unknown
): {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  default?: string;
} | null {
  if (typeof metadataValue === 'string') {
    return {
      name: fieldName,
      type: 'string',
      default: metadataValue,
    };
  }

  if (typeof metadataValue === 'number' || typeof metadataValue === 'boolean') {
    return {
      name: fieldName,
      type: 'string',
      default: String(metadataValue),
    };
  }

  if (
    !metadataValue ||
    typeof metadataValue !== 'object' ||
    Array.isArray(metadataValue)
  ) {
    return null;
  }

  const metadataObject = metadataValue as Record<string, unknown>;
  const hasStructuredMetadata = [
    'type',
    'description',
    'required',
    'enum',
    'default',
  ].some(key => key in metadataObject);

  if (!hasStructuredMetadata) {
    return null;
  }

  return {
    name: fieldName,
    type: typeof metadataObject.type === 'string' ? metadataObject.type : 'string',
    description:
      typeof metadataObject.description === 'string'
        ? metadataObject.description
        : undefined,
    required:
      typeof metadataObject.required === 'boolean'
        ? metadataObject.required
        : undefined,
    enum:
      Array.isArray(metadataObject.enum) &&
      metadataObject.enum.every(option => typeof option === 'string')
        ? (metadataObject.enum as string[])
        : undefined,
    default: normalizeDefaultValue(metadataObject.default),
  };
}

function isMetadataField(
  field: ReturnType<typeof createMetadataOnlyField>
): field is NonNullable<ReturnType<typeof createMetadataOnlyField>> {
  return field !== null;
}

function mergeFieldsWithMetadata(
  fields: ReturnType<typeof extractFieldsFromSchema>,
  metadataSection: unknown
) {
  const metadata = toRecord(metadataSection);
  const mergedFields = fields.map(field => {
    const fieldMetadata = resolveFieldMetadata(metadata, field.name);
    return {
      ...field,
      ...fieldMetadata,
      required: fieldMetadata.required ?? field.required,
      description: fieldMetadata.description ?? field.description,
      default: fieldMetadata.default ?? field.default,
      enum: fieldMetadata.enum ?? field.enum,
      type: fieldMetadata.type ?? field.type,
    };
  });

  const existingFieldNames = new Set(mergedFields.map(field => field.name));
  const metadataOnlyFields = Object.entries(metadata)
    .filter(([fieldName]) => !existingFieldNames.has(fieldName))
    .map(([fieldName, metadataValue]) =>
      createMetadataOnlyField(fieldName, metadataValue)
    )
    .filter(isMetadataField);

  return [...mergedFields, ...metadataOnlyFields];
}

function getEffectiveFieldValue(
  field: { name: string; default?: string },
  values: Record<string, FieldValue>
) {
  return values[field.name] ?? field.default;
}

export function Form({
  x402Response,
  inputSchema,
  maxAmountRequired,
  method,
  resource,
  requestMetadata,
}: Props) {
  const metadataHeaders = requestMetadata?.headers;
  const metadataQueryParams = requestMetadata?.queryParams;
  const metadataBody = requestMetadata?.body;

  const headerFields = useMemo(
    () =>
      mergeFieldsWithMetadata(
        extractFieldsFromSchema(inputSchema, method, 'header'),
        metadataHeaders
      ),
    [inputSchema, method, metadataHeaders]
  );

  const queryFields = useMemo(
    () =>
      mergeFieldsWithMetadata(
        extractFieldsFromSchema(inputSchema, method, 'query'),
        metadataQueryParams
      ),
    [inputSchema, method, metadataQueryParams]
  );

  const bodyFields = useMemo(
    () =>
      mergeFieldsWithMetadata(
        extractFieldsFromSchema(inputSchema, method, 'body'),
        metadataBody
      ),
    [inputSchema, method, metadataBody]
  );

  const [headerValues, setHeaderValues] = useState<Record<string, FieldValue>>(
    {}
  );
  const [queryValues, setQueryValues] = useState<Record<string, FieldValue>>(
    {}
  );
  const [bodyValues, setBodyValues] = useState<Record<string, FieldValue>>({});

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
      const value = getEffectiveFieldValue(field, headerValues);
      return value !== undefined && isValidFieldValue(value);
    });
    const queryFilled = requiredQuery.every(field => {
      const value = getEffectiveFieldValue(field, queryValues);
      return value !== undefined && isValidFieldValue(value);
    });
    const bodyFilled = requiredBody.every(field => {
      const value = getEffectiveFieldValue(field, bodyValues);
      return value !== undefined && isValidFieldValue(value);
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
    const queryEntries = queryFields.reduce<[string, string][]>(
      (acc, field) => {
        const value = getEffectiveFieldValue(field, queryValues);
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            acc.push([field.name, trimmed]);
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
  }, [resource, queryValues, queryFields]);

  const isReservedHeader = (name: string) =>
    name.trim().toLowerCase() === 'x-payment';

  const headerEntries = useMemo(() => {
    return headerFields.reduce<[string, string][]>((acc, field) => {
      if (isReservedHeader(field.name)) return acc;
      const value = getEffectiveFieldValue(field, headerValues);
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          acc.push([field.name, trimmed]);
        }
      }
      return acc;
    }, []);
  }, [headerValues, headerFields]);

  const bodyEntries = useMemo(() => {
    return bodyFields.reduce<[string, FieldValue | number | boolean][]>(
      (acc, field) => {
        const value = getEffectiveFieldValue(field, bodyValues);
        const fieldType = field?.type;

        if (Array.isArray(value)) {
          if (value.length > 0) {
            acc.push([field.name, value]);
          }
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            if (fieldType === 'number' || fieldType === 'integer') {
              const num = Number(trimmed);
              if (!isNaN(num)) {
                acc.push([field.name, num]);
              }
            } else if (fieldType === 'boolean') {
              acc.push([field.name, trimmed === 'true']);
            } else {
              acc.push([field.name, trimmed]);
            }
          }
        }
        return acc;
      },
      []
    );
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

  return (
    <CardContent className="flex flex-col gap-4 p-4 border-t">
      {hasFields && (
        <div className="space-y-4">
          <FieldSection
            fields={headerFields}
            values={headerValues}
            onChange={handleHeaderChange}
            prefix="header"
            title="Header Parameters"
          />
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
