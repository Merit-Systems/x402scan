import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';

import { FieldInput } from './field-input';

import type { FieldDefinition, FieldValue } from '@/types/x402';

interface FieldSectionProps {
  fields: FieldDefinition[];
  values: Record<string, FieldValue>;
  onChange: (name: string, value: FieldValue) => void;
  prefix: string;
  title?: string;
}

export function FieldSection({
  fields,
  values,
  onChange,
  prefix,
  title,
}: FieldSectionProps) {
  if (fields.length === 0) {
    return null;
  }

  const requiredFields = fields.filter(field => field.required);
  const optionalFields = fields.filter(field => !field.required);

  const renderField = (field: FieldDefinition) => (
    <div key={`${prefix}-${field.name}`} className="space-y-1">
      <Label htmlFor={`${prefix}-${field.name}`}>
        {field.name}
        {field.required ? <span className="text-destructive">*</span> : null}
      </Label>
      <FieldInput
        field={field}
        value={values[field.name] ?? field.default ?? ''}
        onChange={value => onChange(field.name, value)}
        prefix={prefix}
      />
      {(field.description || field.default) && (
        <p className="text-xs text-muted-foreground">
          {field.description}
          {field.description && field.default ? ' ' : null}
          {field.default ? (
            <span className="font-medium">Default: {String(field.default)}</span>
          ) : null}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      {requiredFields.length > 0 ? (
        <div className="space-y-3">{requiredFields.map(renderField)}</div>
      ) : null}
      {optionalFields.length > 0 ? (
        <Collapsible className="rounded-md border bg-muted/30">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-between px-3 py-2 text-left text-xs font-medium text-muted-foreground"
            >
              <span>Optional parameters ({optionalFields.length})</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 border-t px-3 py-3">
            {optionalFields.map(renderField)}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
