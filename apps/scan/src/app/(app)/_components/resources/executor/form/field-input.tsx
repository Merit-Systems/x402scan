import { Plus, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { FieldDefinition, FieldValue } from '@/types/x402';

interface PropertyDefinition {
  type: string;
  description?: string;
  enum?: string[];
  isRequired: boolean;
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
    if (field.items?.properties) {
      const newItem: Record<string, string> = {};
      Object.keys(field.items.properties).forEach(key => {
        newItem[key] = '';
      });
      onChange([...value, newItem]);
    } else {
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

export function FieldInput({
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
