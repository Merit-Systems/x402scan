'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { FetchButton } from './header/fetch-button';
import { Status } from './header/status';

import { ResourceFetchProvider } from './contexts/fetch/provider';
import { useResourceFetch } from './contexts/fetch/hook';

import type { Methods } from '@/types/x402';
import type { Resources } from '@prisma/client';
import type { ParsedX402Response } from '@/lib/x402/schema';
import type { FieldDefinition } from '@/types/x402';

interface Props {
  resource: Resources;
  response: ParsedX402Response;
  bazaarMethod: Methods;
}

export const DrawerResourceExecutor: React.FC<Props> = ({
  resource,
  response,
  bazaarMethod,
}) => {
  return (
    <ResourceFetchWrapper
      response={response}
      bazaarMethod={bazaarMethod}
      resource={resource.resource}
    >
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="space-y-4 pb-4">
          {/* Method and Status */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {bazaarMethod}
            </Badge>
            <Status response={response} />
          </div>

          {/* URL Box */}
          <div className="relative group rounded-lg border bg-muted/30 p-3 pr-20">
            <div className="font-mono text-sm truncate leading-relaxed">
              {resource.resource}
            </div>
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <CopyButton
                text={resource.resource}
                toastMessage="URL copied to clipboard"
                variant="ghost"
                size="icon"
                className="size-8 opacity-60 group-hover:opacity-100 transition-opacity"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 opacity-60 group-hover:opacity-100 transition-opacity"
                onClick={() => window.open(resource.resource, '_blank')}
              >
                <ExternalLink className="size-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {response?.accepts?.[0]?.description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {response.accepts[0].description}
            </p>
          )}

          <Separator />
        </div>

        {/* Action Button */}
        <div className="pb-6 flex justify-end">
          <FetchButton />
        </div>

        {/* Form Section */}
        <div className="flex-1 min-h-0">
          <DrawerForm />
        </div>
      </div>
    </ResourceFetchWrapper>
  );
};

function DrawerForm() {
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
    <div className="flex flex-col gap-6">
      {!hasQueryFields && !hasBodyFields ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            No input parameters required.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {hasQueryFields && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Query Parameters</h3>
              {queryFields.map(field => (
                <div key={`query-${field.name}`} className="space-y-2">
                  <Label htmlFor={`query-${field.name}`} className="text-sm">
                    {field.name}
                    {field.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <FieldInput
                    field={field}
                    value={queryValues[field.name] ?? field.default ?? ''}
                    onChange={value => handleQueryChange(field.name, value)}
                    prefix="query"
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasBodyFields && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Body Parameters</h3>
              {bodyFields.map(field => (
                <div key={`body-${field.name}`} className="space-y-2">
                  <Label htmlFor={`body-${field.name}`} className="text-sm">
                    {field.name}
                    {field.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <FieldInput
                    field={field}
                    value={bodyValues[field.name] ?? field.default ?? ''}
                    onChange={value => handleBodyChange(field.name, value)}
                    prefix="body"
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {response !== undefined && (
        <div className="rounded-lg bg-muted/50 border">
          <div className="p-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Response
            </h4>
            <pre className="max-h-60 overflow-auto text-xs font-mono">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
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

function ResourceFetchWrapper({
  children,
  response,
  bazaarMethod,
  resource,
}: {
  children: React.ReactNode;
  response: ParsedX402Response;
  bazaarMethod: Methods;
  resource: string;
}) {
  if (!response) return children;

  const accept = response?.accepts?.[0];

  if (!accept) return null;

  const inputSchema = accept.outputSchema?.input;

  if (!inputSchema) return null;

  const maxAmountRequired = BigInt(accept.maxAmountRequired);

  return (
    <ResourceFetchProvider
      inputSchema={inputSchema}
      maxAmountRequired={maxAmountRequired}
      method={bazaarMethod}
      resource={resource}
      x402Response={response}
    >
      {children}
    </ResourceFetchProvider>
  );
}
