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
import type { FieldDefinition } from '@/types/x402';
import type { ParsedX402Response } from '@/lib/x402/schema';
import { FetchButton } from './header/fetch-button';
import { Chain } from '@/types/chain';

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

      {response !== undefined && (
        <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </CardContent>
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
              Object.entries(itemsProperties).map(([propName, propDef]) => {
                const propField = propDef as Record<string, unknown>;
                const propType =
                  typeof propField.type === 'string'
                    ? propField.type
                    : 'string';
                const propDescription =
                  typeof propField.description === 'string'
                    ? propField.description
                    : undefined;
                const propEnum = Array.isArray(propField.enum)
                  ? (propField.enum as string[])
                  : undefined;
                const isRequired = itemsRequired.includes(propName);

                return (
                  <div key={propName} className="space-y-1">
                    <Label
                      htmlFor={`${prefix}-${field.name}-${index}-${propName}`}
                      className="text-xs"
                    >
                      {propName}
                      {isRequired && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    {propEnum && propEnum.length > 0 ? (
                      <Select
                        value={(item as Record<string, string>)[propName] ?? ''}
                        onValueChange={val =>
                          updateItemField(index, propName, val)
                        }
                      >
                        <SelectTrigger
                          id={`${prefix}-${field.name}-${index}-${propName}`}
                          className="w-full h-8"
                        >
                          <SelectValue
                            placeholder={
                              propDescription ?? `Select ${propName}`
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {propEnum.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`${prefix}-${field.name}-${index}-${propName}`}
                        className="h-8"
                        placeholder={propDescription ?? propType}
                        value={(item as Record<string, string>)[propName] ?? ''}
                        onChange={e =>
                          updateItemField(index, propName, e.target.value)
                        }
                      />
                    )}
                  </div>
                );
              })
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
  value: string | unknown[];
  onChange: (value: string | unknown[]) => void;
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

  // Ensure value is string for non-array fields
  const stringValue = typeof value === 'string' ? value : '';

  // If field has enum options, render a Select dropdown
  if (field.enum && field.enum.length > 0) {
    return (
      <Select value={stringValue} onValueChange={onChange}>
        <SelectTrigger id={fieldId} className="w-full">
          <SelectValue
            placeholder={field.description ?? `Select ${field.name}`}
          />
        </SelectTrigger>
        <SelectContent>
          {field.enum.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Default to regular input
  return (
    <Input
      id={fieldId}
      placeholder={field.description ?? field.type ?? 'Value'}
      value={stringValue}
      onChange={event => onChange(event.target.value)}
      aria-required={field.required}
    />
  );
}
