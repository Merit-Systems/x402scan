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

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      {fields.map(field => (
        <div key={`${prefix}-${field.name}`} className="space-y-1">
          <Label htmlFor={`${prefix}-${field.name}`}>
            {field.name}
            {field.required ? (
              <span className="text-destructive">*</span>
            ) : null}
          </Label>
          <FieldInput
            field={field}
            value={values[field.name] ?? field.default ?? ''}
            onChange={value => onChange(field.name, value)}
            prefix={prefix}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
