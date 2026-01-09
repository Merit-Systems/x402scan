'use client';

import { useMemo, useState } from 'react';

import { Plus, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { JsonViewer } from '@/components/ai-elements/json-viewer';

import { ResourceFetch } from '../../../resource-fetch';

import { SUPPORTED_CHAINS } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';
import { Methods, type FieldDefinition, type FieldValue } from '@/types/x402';
import {
  normalizeChainId,
  type ParsedX402Response,
  type InputSchema,
} from '@/lib/x402';
import type { X402FetchResponse } from '@/app/_hooks/x402/types';
import type { JsonValue } from '@/components/ai-elements/json-viewer';

interface PropertyDefinition {
  type: string;
  description?: string;
  enum?: string[];
  isRequired: boolean;
}

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
  // Handle both v1 format (queryParams/bodyFields) and v2 raw JSON Schema (properties)
  // For v2: if method is GET, treat properties as query params; if POST, treat as body fields
  const isV2RawSchema =
    !inputSchema.queryParams &&
    !inputSchema.bodyFields &&
    'properties' in inputSchema;

  // v2 body schema: body is a JSON Schema object with properties
  // Cast to allow v2 schema fields that aren't in the v1 type definition
  const v2Body = (inputSchema as Record<string, unknown>).body as
    | Record<string, unknown>
    | undefined;
  const isV2BodySchema =
    !inputSchema.bodyFields &&
    v2Body &&
    typeof v2Body === 'object' &&
    'properties' in v2Body;

  // v2 query schema: queryParams is a JSON Schema object with properties
  const isV2QuerySchema =
    inputSchema.queryParams &&
    typeof inputSchema.queryParams === 'object' &&
    'properties' in (inputSchema.queryParams as object);

  const queryFields = useMemo(() => {
    // v2: queryParams is a JSON Schema with properties
    if (isV2QuerySchema) {
      const querySchema = inputSchema.queryParams as {
        properties?: Record<string, unknown>;
        required?: string[];
      };
      return getFields(querySchema.properties, querySchema.required);
    }
    // v1: queryParams is a flat map
    if (inputSchema.queryParams) {
      return getFields(inputSchema.queryParams);
    }
    // v2 raw JSON Schema: GET methods use properties as query params
    if (isV2RawSchema && method === Methods.GET) {
      const schema = inputSchema as {
        properties?: Record<string, unknown>;
        required?: string[];
      };
      return getFields(schema.properties, schema.required);
    }
    return [];
  }, [inputSchema, isV2RawSchema, isV2QuerySchema, method]);

  const bodyFields = useMemo(() => {
    // v2: body is a JSON Schema with properties
    if (isV2BodySchema && v2Body && method !== Methods.GET) {
      const bodySchema = v2Body as {
        properties?: Record<string, unknown>;
        required?: string[];
      };
      return getFields(bodySchema.properties, bodySchema.required);
    }
    // v1: bodyFields is a flat map
    if (inputSchema.bodyFields) {
      return getFields(inputSchema.bodyFields);
    }
    // v2 raw JSON Schema: POST/PUT/PATCH methods use properties as body fields
    if (isV2RawSchema && method !== Methods.GET) {
      const schema = inputSchema as {
        properties?: Record<string, unknown>;
        required?: string[];
      };
      return getFields(schema.properties, schema.required);
    }
    return [];
  }, [inputSchema, v2Body, isV2RawSchema, isV2BodySchema, method]);

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
      Object.entries(bodyValues).reduce<
        Array<[string, FieldValue | number | boolean]>
      >((acc, [key, value]) => {
        // Find the field definition to get the type
        const field = bodyFields.find(f => f.name === key);
        const fieldType = field?.type;

        if (Array.isArray(value)) {
          if (value.length > 0) {
            acc.push([key, value]);
          }
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            // Convert based on field type
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
      }, []),
    [bodyValues, bodyFields]
  );

  const reconstructedBody = reconstructNestedObject(
    Object.fromEntries(bodyEntries)
  );

  const requestInit: RequestInit = {
    method,
    body:
      bodyEntries.length > 0 ? JSON.stringify(reconstructedBody) : undefined,
  };

  const hasQueryFields = queryFields.length > 0;
  const hasBodyFields = bodyFields.length > 0;

  const [data, setData] = useState<X402FetchResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  return (
    <CardContent className="flex flex-col gap-4 p-4 border-t">
      {!hasQueryFields && !hasBodyFields ? null : (
        <div className="space-y-4">
          {hasQueryFields && (
            <div className="space-y-3">
              {queryFields.map(field => (
                <div key={`query-${field.name}`} className="space-y-1">
                  <Label htmlFor={`query-${field.name}`}>
                    {field.name}
                    {field.required ? (
                      <span className="text-destructive">*</span>
                    ) : null}
                  </Label>
                  <FieldInput
                    field={field}
                    value={queryValues[field.name] ?? field.default ?? ''}
                    onChange={value => handleQueryChange(field.name, value)}
                    prefix="query"
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasBodyFields && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Body Parameters
              </h3>
              {bodyFields.map(field => (
                <div key={`body-${field.name}`} className="space-y-1">
                  <Label htmlFor={`body-${field.name}`}>
                    {field.name}
                    {field.required ? (
                      <span className="text-destructive">*</span>
                    ) : null}
                  </Label>
                  <FieldInput
                    field={field}
                    value={bodyValues[field.name] ?? field.default ?? ''}
                    onChange={value => handleBodyChange(field.name, value)}
                    prefix="body"
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(() => {
        const networks = x402Response.accepts?.map(a => a.network ?? '') ?? [];
        const normalized = networks.map(n => normalizeChainId(n));
        const supported = normalized.filter(n =>
          (SUPPORTED_CHAINS as ReadonlyArray<string>).includes(n)
        ) as SupportedChain[];

        if (supported.length === 0) {
          return (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
              No supported payment networks found.
              {networks.length > 0 && (
                <span className="block text-xs mt-1">
                  Networks in response: {networks.join(', ')}
                </span>
              )}
            </div>
          );
        }

        return (
          <ResourceFetch
            chains={supported}
            allRequiredFieldsFilled={allRequiredFieldsFilled}
            maxAmountRequired={maxAmountRequired}
            targetUrl={targetUrl}
            requestInit={requestInit}
            options={{
              onSuccess: data => setData(data),
              onError: error => setError(error),
            }}
          />
        );
      })()}

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

function parsePropertyDefinition(
  propDef: unknown,
  propName: string,
  itemsRequired: string[]
): PropertyDefinition {
  const propField = propDef as Record<string, unknown>;
  return {
    type: typeof propField.type === 'string' ? propField.type : 'string',
    description:
      typeof propField.description === 'string'
        ? propField.description
        : undefined,
    enum: Array.isArray(propField.enum)
      ? (propField.enum as string[])
      : undefined,
    isRequired: itemsRequired.includes(propName),
  };
}

function PropertyFieldInput({
  propName,
  propDef,
  value,
  onChange,
  fieldId,
  showLabel = true,
}: {
  propName: string;
  propDef: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
  fieldId: string;
  showLabel?: boolean;
}) {
  return (
    <div className="space-y-1">
      {showLabel && (
        <Label htmlFor={fieldId} className="text-xs">
          {propName}
          {propDef.isRequired && <span className="text-destructive">*</span>}
        </Label>
      )}
      {propDef.enum && propDef.enum.length > 0 ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={fieldId} className="w-full h-8">
            <SelectValue
              placeholder={propDef.description ?? `Select ${propName}`}
            />
          </SelectTrigger>
          <SelectContent>
            {propDef.enum.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={fieldId}
          className="h-8"
          placeholder={propDef.description ?? propDef.type}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function ArrayFieldInput({
  field,
  value,
  onChange,
  prefix,
}: {
  field: FieldDefinition;
  value: unknown[];
  onChange: (value: unknown[]) => void;
  prefix: string;
}) {
  const addItem = () => {
    // Create empty object based on items.properties schema
    if (field.items?.properties) {
      const newItem: Record<string, string> = {};
      Object.keys(field.items.properties).forEach(key => {
        newItem[key] = '';
      });
      onChange([...value, newItem]);
    } else {
      // Simple array of strings
      onChange([...value, '']);
    }
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, itemValue: unknown) => {
    const newValue = [...value];
    newValue[index] = itemValue;
    onChange(newValue);
  };

  const updateItemField = (
    index: number,
    fieldName: string,
    fieldValue: string
  ) => {
    const newValue = [...value];
    const item = newValue[index] as Record<string, string>;
    item[fieldName] = fieldValue;
    onChange(newValue);
  };

  const itemsProperties = field.items?.properties;
  const itemsRequired = field.items?.required ?? [];

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div
          key={index}
          className="flex gap-2 items-start border rounded-md p-3"
        >
          <div className="flex-1 space-y-2">
            {itemsProperties ? (
              // Render object properties
              Object.entries(itemsProperties).map(([propName, propDef]) => (
                <PropertyFieldInput
                  key={propName}
                  propName={propName}
                  propDef={parsePropertyDefinition(
                    propDef,
                    propName,
                    itemsRequired
                  )}
                  value={(item as Record<string, string>)[propName] ?? ''}
                  onChange={val => updateItemField(index, propName, val)}
                  fieldId={`${prefix}-${field.name}-${index}-${propName}`}
                />
              ))
            ) : (
              // Simple string array
              <Input
                className="h-8"
                placeholder={field.items?.type ?? 'Value'}
                value={item as string}
                onChange={e => updateItem(index, e.target.value)}
              />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => removeItem(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addItem}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {field.name}
      </Button>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  prefix,
}: {
  field: FieldDefinition;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  prefix: string;
}) {
  const fieldId = `${prefix}-${field.name}`;

  // Handle array type
  if (field.type === 'array' && field.items) {
    return (
      <ArrayFieldInput
        field={field}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
        prefix={prefix}
      />
    );
  }

  // Delegate to PropertyFieldInput for non-array fields
  // Label is already rendered by the parent Form component
  return (
    <PropertyFieldInput
      propName={field.name}
      propDef={{
        type: field.type ?? 'string',
        description: field.description,
        enum: field.enum,
        isRequired: field.required ?? false,
      }}
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
      fieldId={fieldId}
      showLabel={false}
    />
  );
}

function getFields(
  record: Record<string, unknown> | null | undefined,
  requiredFields?: string[]
): FieldDefinition[] {
  if (!record) {
    return [];
  }

  return expandFields(record, '', requiredFields);
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
    // Handle object type with properties - expand recursively
    else if (
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

function isValidFieldValue(value: FieldValue): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return typeof value === 'string' && value.trim().length > 0;
}

function reconstructNestedObject(
  flatObject: Record<string, FieldValue | number | boolean>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flatObject)) {
    // Arrays are already structured correctly, just assign them
    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    const parts = key.split('.');
    let current = result;

    // Navigate/create nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part && !(part in current)) {
        current[part] = {};
      }
      current = current[part!] as Record<string, unknown>;
    }

    // Set the final value
    const finalKey = parts[parts.length - 1];
    current[finalKey!] = value;
  }

  return result;
}
