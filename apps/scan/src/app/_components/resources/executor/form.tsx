'use client';

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
import { Plus, X } from 'lucide-react';

import { useResourceFetch } from './contexts/fetch/hook';
import type { FieldDefinition, FieldValue } from '@/types/x402';
import type { ParsedX402Response } from '@/lib/x402/schema';
import type { JsonValue } from '@/components/ai-elements/json-viewer';
import { FetchButton } from './header/fetch-button';
import { Chain } from '@/types/chain';
import { JsonViewer } from '@/components/ai-elements/json-viewer';

interface PropertyDefinition {
  type: string;
  description?: string;
  enum?: string[];
  isRequired: boolean;
}

interface Props {
  x402Response: ParsedX402Response;
}

export function Form({ x402Response }: Props) {
  const {
    queryFields,
    bodyFields,
    queryValues,
    bodyValues,
    handleQueryChange,
    handleBodyChange,
    response,
    error,
  } = useResourceFetch();

  const hasQueryFields = queryFields.length > 0;
  const hasBodyFields = bodyFields.length > 0;

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
                    value={
                      queryValues[field.name] ??
                      (field.type === 'object' && field.properties
                        ? undefined
                        : (field.default ?? ''))
                    }
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
                    value={
                      bodyValues[field.name] ??
                      (field.type === 'object' && field.properties
                        ? undefined
                        : (field.default ?? ''))
                    }
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

      <FetchButton
        chains={
          (x402Response.accepts
            ?.map(accept => accept.network)
            .filter(network =>
              Object.values(Chain).includes(network as Chain)
            ) ?? []) as Chain[]
        }
      />

      {/* Error and response display - always visible */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
      )}

      {response && (
        <pre className="max-h-60 overflow-auto rounded-md bg-muted text-xs">
          {response.type === 'json' ? (
            <JsonViewer data={response.data as JsonValue} />
          ) : (
            <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(response.data, null, 2)}
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

function ObjectFieldInput({
  field,
  value,
  onChange,
  prefix,
}: {
  field: FieldDefinition;
  value: Record<string, unknown> | undefined;
  onChange: (value: Record<string, unknown> | undefined) => void;
  prefix: string;
}) {
  const hasValue = value !== undefined && value !== null;
  const properties = field.properties ?? {};
  const propertiesRequired = field.propertiesRequired ?? [];

  const updateProperty = (propName: string, propValue: string) => {
    const newValue = { ...(value ?? {}), [propName]: propValue };
    onChange(newValue);
  };

  const removeObject = () => {
    onChange(undefined);
  };

  const addObject = () => {
    const newValue: Record<string, string> = {};
    Object.keys(properties).forEach(key => {
      newValue[key] = '';
    });
    onChange(newValue);
  };

  if (!hasValue) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addObject}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {field.name}
      </Button>
    );
  }

  return (
    <div className="space-y-2 border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{field.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={removeObject}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {Object.entries(properties).map(([propName, propDef]) => (
          <PropertyFieldInput
            key={propName}
            propName={propName}
            propDef={parsePropertyDefinition(
              propDef,
              propName,
              propertiesRequired
            )}
            value={(value as Record<string, string>)[propName] ?? ''}
            onChange={val => updateProperty(propName, val)}
            fieldId={`${prefix}-${field.name}-${propName}`}
          />
        ))}
      </div>
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

  // Handle object type with properties
  if (field.type === 'object' && field.properties) {
    return (
      <ObjectFieldInput
        field={field}
        value={
          typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : undefined
        }
        onChange={
          onChange as (value: Record<string, unknown> | undefined) => void
        }
        prefix={prefix}
      />
    );
  }

  // Delegate to PropertyFieldInput for non-array, non-object fields
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
