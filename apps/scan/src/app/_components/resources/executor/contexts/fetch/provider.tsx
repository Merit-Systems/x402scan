import { useMemo, useState } from 'react';

import { ResourceFetchContext } from './context';

import { useX402Fetch } from '@/app/_hooks/x402/use-fetch';

import type { ParsedX402Response } from '@/lib/x402/schema';
import type { FieldDefinition, FieldValue, Methods } from '@/types/x402';

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

  const queryEntries = useMemo(
    () =>
      Object.entries(queryValues).reduce<Array<[string, string]>>(
        (acc, [key, value]) => {
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              acc.push([key, trimmed]);
            }
          }
          // Arrays in query params are not typical, but skip them
          return acc;
        },
        []
      ),
    [queryValues]
  );

  // Build URL with query parameters
  const targetUrl = useMemo(() => {
    if (queryEntries.length === 0) return resource;
    const searchParams = new URLSearchParams(queryEntries);
    const separator = resource.includes('?') ? '&' : '?';
    return `${resource}${separator}${searchParams.toString()}`;
  }, [resource, queryEntries]);

  const bodyEntries = useMemo(
    () =>
      Object.entries(bodyValues).reduce<Array<[string, FieldValue]>>(
        (acc, [key, value]) => {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              acc.push([key, value]);
            }
          } else if (typeof value === 'object' && value !== null) {
            // Objects are already structured correctly
            if (isValidFieldValue(value)) {
              acc.push([key, value]);
            }
          } else if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              acc.push([key, trimmed]);
            }
          }
          return acc;
        },
        []
      ),
    [bodyValues]
  );

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
    // If field.required is an array, it means nested properties are required,
    // but the field itself is optional (unless parent says otherwise)
    // If field.required is undefined, check parent's required array
    const isFieldRequired =
      field.required === true
        ? true
        : field.required === false
          ? false
          : (parentRequired?.includes(name) ?? false);

    // Handle array type with items - preserve items schema
    if (
      fieldType === 'array' &&
      field.items &&
      typeof field.items === 'object'
    ) {
      const items = field.items as Record<string, unknown>;
      fields.push({
        name: fullName,
        type: fieldType,
        description: fieldDescription,
        required: isFieldRequired,
        enum: fieldEnum,
        default: fieldDefault,
        items: {
          type: typeof items.type === 'string' ? items.type : undefined,
          properties:
            typeof items.properties === 'object' && items.properties !== null
              ? (items.properties as Record<string, unknown>)
              : undefined,
          required: Array.isArray(items.required)
            ? (items.required as string[])
            : undefined,
        },
      } satisfies FieldDefinition);
    }
    // Handle object type with properties - expand recursively ONLY if required
    else if (
      fieldType === 'object' &&
      field.properties &&
      typeof field.properties === 'object'
    ) {
      const objectRequired = Array.isArray(field.required)
        ? field.required
        : [];

      // If the object itself is required, expand it recursively
      // Otherwise, keep it as an object field with properties metadata
      if (isFieldRequired) {
        const expandedFields = expandFields(
          field.properties as Record<string, unknown>,
          fullName,
          objectRequired
        );
        fields.push(...expandedFields);
      } else {
        // Optional object - preserve it as a single field with properties metadata
        fields.push({
          name: fullName,
          type: fieldType,
          description: fieldDescription,
          required: isFieldRequired,
          enum: fieldEnum,
          default: fieldDefault,
          properties: field.properties as Record<string, unknown>,
          propertiesRequired: objectRequired,
        } satisfies FieldDefinition);
      }
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

function isValidFieldValue(value: FieldValue): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object' && value !== null) {
    // For objects, check if at least one property has a value
    return Object.values(value).some(v => {
      if (typeof v === 'string') {
        return v.trim().length > 0;
      }
      return v !== null && v !== undefined;
    });
  }
  return typeof value === 'string' && value.trim().length > 0;
}

function reconstructNestedObject(
  flatObject: Record<string, FieldValue>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flatObject)) {
    // Arrays and objects (but not strings) are already structured correctly
    if (
      Array.isArray(value) ||
      (typeof value === 'object' && value !== null && typeof value !== 'string')
    ) {
      result[key] = value;
      continue;
    }

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
