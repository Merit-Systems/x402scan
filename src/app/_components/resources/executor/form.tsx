'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
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
import { ChevronDown } from 'lucide-react';

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
  
  const [optionalOpen, setOptionalOpen] = useState(false);

  const accept = x402Response?.accepts?.[0];
  const inputSchema = accept?.outputSchema?.input;

  if (!x402Response || !accept || !inputSchema) {
    return (
      <CardContent className="flex flex-col gap-4 p-4 border-t">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">No input parameters required.</p>
        </div>
      </CardContent>
    );
  }

  const hasQueryFields = queryFields.length > 0;
  const hasBodyFields = bodyFields.length > 0;

  // Separate required and optional fields
  const requiredQueryFields = queryFields.filter(field => field.required);
  const optionalQueryFields = queryFields.filter(field => !field.required);
  const requiredBodyFields = bodyFields.filter(field => field.required);
  const optionalBodyFields = bodyFields.filter(field => !field.required);

  const hasRequiredFields = requiredQueryFields.length > 0 || requiredBodyFields.length > 0;
  const hasOptionalFields = optionalQueryFields.length > 0 || optionalBodyFields.length > 0;

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
          {/* Required Parameters Section */}
          {hasRequiredFields && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Required Parameters</h3>
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                  {requiredQueryFields.length + requiredBodyFields.length}
                </span>
              </div>
              
              {requiredQueryFields.map(field => (
                <div key={`query-${field.name}`} className="space-y-1">
                  <Label htmlFor={`query-${field.name}`}>
                    {field.name}
                    <span className="text-destructive ml-1">*</span>
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

              {requiredBodyFields.map(field => (
                <div key={`body-${field.name}`} className="space-y-1">
                  <Label htmlFor={`body-${field.name}`}>
                    {field.name}
                    <span className="text-destructive ml-1">*</span>
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

          {/* Optional Parameters Section - Collapsible */}
          {hasOptionalFields && (
            <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:text-primary transition-colors">
                <ChevronDown
                  className={`size-4 transition-transform ${
                    optionalOpen ? 'rotate-180' : ''
                  }`}
                />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Optional Parameters
                </h3>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {optionalQueryFields.length + optionalBodyFields.length}
                </span>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3 mt-3">
                {optionalQueryFields.map(field => (
                  <div key={`query-${field.name}`} className="space-y-1">
                    <Label htmlFor={`query-${field.name}`} className="text-muted-foreground">
                      {field.name}
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

                {optionalBodyFields.map(field => (
                  <div key={`body-${field.name}`} className="space-y-1">
                    <Label htmlFor={`body-${field.name}`} className="text-muted-foreground">
                      {field.name}
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
              </CollapsibleContent>
            </Collapsible>
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
