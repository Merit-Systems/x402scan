'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { FieldInput } from './field-input';

import { cn } from '@/lib/utils';

import type { FieldDefinition, FieldValue } from '@/types/x402';

interface FieldSectionProps {
  fields: FieldDefinition[];
  values: Record<string, FieldValue>;
  onChange: (name: string, value: FieldValue) => void;
  prefix: string;
  title?: string;
}

function FieldRow({
  field,
  value,
  onChange,
  prefix,
}: {
  field: FieldDefinition;
  value: FieldValue;
  onChange: (name: string, value: FieldValue) => void;
  prefix: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={`${prefix}-${field.name}`}>
        {field.name}
        {field.required ? (
          <span className="text-destructive ml-0.5">*</span>
        ) : (
          <span className="text-muted-foreground/60 text-xs ml-1.5 font-normal">
            optional
          </span>
        )}
      </Label>
      <FieldInput
        field={field}
        value={value}
        onChange={v => onChange(field.name, v)}
        prefix={prefix}
      />
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}

export function FieldSection({
  fields,
  values,
  onChange,
  prefix,
  title,
}: FieldSectionProps) {
  const [optionalOpen, setOptionalOpen] = useState(false);

  if (fields.length === 0) {
    return null;
  }

  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}

      {/* Required fields always visible at top */}
      {requiredFields.length > 0 && (
        <div className="space-y-3">
          {requiredFields.map(field => (
            <FieldRow
              key={`${prefix}-${field.name}`}
              field={field}
              value={values[field.name] ?? field.default ?? ''}
              onChange={onChange}
              prefix={prefix}
            />
          ))}
        </div>
      )}

      {/* Optional fields in a collapsible section */}
      {optionalFields.length > 0 && (
        <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 group cursor-pointer w-full">
            <ChevronRight
              className={cn(
                'size-3.5 transition-transform duration-200',
                optionalOpen && 'rotate-90'
              )}
            />
            <span>
              {optionalFields.length} optional parameter
              {optionalFields.length !== 1 ? 's' : ''}
            </span>
            <div className="flex-1 h-px bg-border ml-1" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 pt-2">
              {optionalFields.map(field => (
                <FieldRow
                  key={`${prefix}-${field.name}`}
                  field={field}
                  value={values[field.name] ?? field.default ?? ''}
                  onChange={onChange}
                  prefix={prefix}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
