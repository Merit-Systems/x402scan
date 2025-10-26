'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
      {!hasQueryFields && !hasBodyFields ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No input parameters required.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hasQueryFields && (
            <FieldSection
              title="Query Parameters"
              fields={queryFields}
              values={queryValues}
              onChange={handleQueryChange}
              prefix="query"
            />
          )}

          {hasBodyFields && (
            <FieldSection
              title="Body Parameters"
              fields={bodyFields}
              values={bodyValues}
              onChange={handleBodyChange}
              prefix="body"
            />
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

interface FieldSectionProps {
  title: string;
  fields: FieldDefinition[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  prefix: string;
}

function FieldSection({
  title,
  fields,
  values,
  onChange,
  prefix,
}: FieldSectionProps) {
  const [showOptional, setShowOptional] = useState(false);

  // Sort fields: required first, then optional
  const requiredFields = fields.filter(field => field.required);
  const optionalFields = fields.filter(field => !field.required);

  const hasRequired = requiredFields.length > 0;
  const hasOptional = optionalFields.length > 0;


  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">
        {title}
        {hasRequired && (
          <span className="ml-1 text-xs text-muted-foreground">
            (Required)
          </span>
        )}
      </h3>
      {hasRequired && (
        <>
          {requiredFields.map(field => (
            <FieldRow
              key={`${prefix}-${field.name}`}
              field={field}
              value={values[field.name] ?? field.default ?? ''}
              onChange={value => onChange(field.name, value)}
              prefix={prefix}
            />
          ))}
        </>
      )}

      {hasOptional && (
        <Collapsible open={showOptional} onOpenChange={setShowOptional}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex w-full items-center justify-between p-2 h-auto hover:bg-muted/50"
            >
              <span className="text-sm font-medium text-muted-foreground">
                Optional Parameters ({optionalFields.length})
              </span>
              {showOptional ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {optionalFields.map(field => (
              <FieldRow
                key={`${prefix}-${field.name}`}
                field={field}
                value={values[field.name] ?? field.default ?? ''}
                onChange={value => onChange(field.name, value)}
                prefix={prefix}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

interface FieldRowProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
  prefix: string;
}

function FieldRow({ field, value, onChange, prefix }: FieldRowProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={`${prefix}-${field.name}`} className="text-sm">
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <FieldInput
        field={field}
        value={value}
        onChange={onChange}
        prefix={prefix}
      />
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
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
  value: string;
  onChange: (value: string) => void;
  prefix: string;
}) {
  const fieldId = `${prefix}-${field.name}`;

  // If field has enum options, render a Select dropdown
  if (field.enum && field.enum.length > 0) {
    return (
      <Select value={value} onValueChange={onChange}>
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
      value={value}
      onChange={event => onChange(event.target.value)}
      aria-required={field.required}
    />
  );
}
