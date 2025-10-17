import { useMemo, useState } from 'react';

import { ResourceFetchContext } from './context';

import { useX402Fetch } from '@/app/_hooks/x402/use-fetch';

import type { ParsedX402Response } from '@/lib/x402/schema';
import type { FieldDefinition, Methods } from '@/types/x402';

type Accept = NonNullable<ParsedX402Response['accepts']>[number];

interface Props {
  children: React.ReactNode;
  inputSchema: NonNullable<Accept['outputSchema']>['input'];
  maxAmountRequired: bigint;
  method: Methods;
  resource: string;
  x402Response: ParsedX402Response;
}

export const ResourceFetchProvider: React.FC<Props> = ({
  children,
  inputSchema,
  maxAmountRequired,
  method,
  resource,
}) => {
  const queryFields = useMemo(
    () => getFields(inputSchema.queryParams),
    [inputSchema]
  );
  const bodyFields = useMemo(
    () => getFields(inputSchema.bodyFields),
    [inputSchema]
  );

  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [bodyValues, setBodyValues] = useState<Record<string, string>>({});

  const handleQueryChange = (name: string, value: string) => {
    setQueryValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBodyChange = (name: string, value: string) => {
    setBodyValues(prev => ({ ...prev, [name]: value }));
  };

  const allRequiredFieldsFilled = useMemo(() => {
    const requiredQuery = queryFields.filter(field => field.required);
    const requiredBody = bodyFields.filter(field => field.required);

    const queryFilled = requiredQuery.every(
      field =>
        queryValues[field.name] && queryValues[field.name].trim().length > 0
    );
    const bodyFilled = requiredBody.every(
      field =>
        bodyValues[field.name] && bodyValues[field.name].trim().length > 0
    );

    return queryFilled && bodyFilled;
  }, [queryFields, bodyFields, queryValues, bodyValues]);

  const queryEntries = Object.entries(queryValues).reduce<
    Array<[string, string]>
  >((acc, [key, value]) => {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      acc.push([key, trimmed]);
    }
    return acc;
  }, []);

  // Build URL with query parameters
  const targetUrl = useMemo(() => {
    if (queryEntries.length === 0) return resource;
    const searchParams = new URLSearchParams(queryEntries);
    const separator = resource.includes('?') ? '&' : '?';
    return `${resource}${separator}${searchParams.toString()}`;
  }, [resource, queryEntries]);

  const bodyEntries = Object.entries(bodyValues).reduce<
    Array<[string, string]>
  >((acc, [key, value]) => {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      acc.push([key, trimmed]);
    }
    return acc;
  }, []);

  const reconstructedBody = reconstructNestedObject(
    Object.fromEntries(bodyEntries)
  );

  const {
    data: response,
    mutate: execute,
    isPending,
    error,
  } = useX402Fetch(targetUrl, maxAmountRequired, {
    method,
    body:
      bodyEntries.length > 0 ? JSON.stringify(reconstructedBody) : undefined,
  });

  return (
    <ResourceFetchContext.Provider
      value={{
        queryValues,
        bodyValues,
        queryFields,
        bodyFields,
        handleQueryChange,
        handleBodyChange,
        allRequiredFieldsFilled,
        execute,
        isPending,
        error: error?.message ?? null,
        response,
        maxAmountRequired,
      }}
    >
      {children}
    </ResourceFetchContext.Provider>
  );
};

function getFields(
  record: Record<string, unknown> | null | undefined
): FieldDefinition[] {
  if (!record) {
    return [];
  }

  return expandFields(record);
}

function expandFields(
  record: Record<string, unknown>,
  prefix = '',
  parentRequired?: string[]
): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  for (const [name, raw] of Object.entries(record)) {
    const fullName = prefix ? `${prefix}.${name}` : name;

    if (typeof raw === 'string') {
      fields.push({
        name: fullName,
        type: raw,
        required: parentRequired?.includes(name) ?? false,
        enum: undefined,
        default: undefined,
      } satisfies FieldDefinition);
      continue;
    }

    if (typeof raw !== 'object' || !raw) {
      continue;
    }

    const field = raw as Record<string, unknown>;
    const fieldType = typeof field.type === 'string' ? field.type : undefined;
    const fieldDescription =
      typeof field.description === 'string' ? field.description : undefined;
    const fieldEnum = Array.isArray(field.enum)
      ? (field.enum as string[])
      : undefined;
    const fieldDefault =
      typeof field.default === 'string' ? field.default : undefined;

    // Determine if this field is required
    const isFieldRequired =
      typeof field.required === 'boolean'
        ? field.required
        : (parentRequired?.includes(name) ?? false);

    // Handle object type with properties - expand recursively
    if (
      fieldType === 'object' &&
      field.properties &&
      typeof field.properties === 'object'
    ) {
      const objectRequired = Array.isArray(field.required)
        ? field.required
        : [];
      const expandedFields = expandFields(
        field.properties as Record<string, unknown>,
        fullName,
        objectRequired
      );
      fields.push(...expandedFields);
    } else {
      // Regular field or object without properties
      fields.push({
        name: fullName,
        type: fieldType,
        description: fieldDescription,
        required: isFieldRequired,
        enum: fieldEnum,
        default: fieldDefault,
      } satisfies FieldDefinition);
    }
  }

  return fields;
}

function reconstructNestedObject(
  flatObject: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flatObject)) {
    const parts = key.split('.');
    let current = result;

    // Navigate/create nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    // Set the final value
    const finalKey = parts[parts.length - 1];
    current[finalKey] = value;
  }

  return result;
}
