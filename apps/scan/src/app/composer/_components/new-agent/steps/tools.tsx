import { Controller } from 'react-hook-form';

import { Field, FieldGroup } from '@/components/ui/field';

import { ResourceList } from '@/app/composer/(chat)/_components/resource-list';

import type { NewAgentForm } from './types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface Props {
  form: NewAgentForm;
  onNext: () => void;
}

export const ToolsStep: React.FC<Props> = ({ form, onNext }) => {
  return (
    <div className="flex flex-col">
      <FieldGroup className="w-full items-start gap-6 flex flex-col">
        <Controller
          control={form.control}
          name="resourceIds"
          render={({ field }) => {
            return (
              <Field>
                <ResourceList
                  selectedResourceIds={field.value}
                  onSelectResource={resource => {
                    field.onChange(
                      field.value.includes(resource.id)
                        ? field.value.filter(id => id !== resource.id)
                        : [...field.value, resource.id]
                    );
                  }}
                />
              </Field>
            );
          }}
        />
      </FieldGroup>
      <div className="flex justify-end p-4 border-t bg-muted">
        <Button
          onClick={onNext}
          disabled={
            !!form.formState.errors.resourceIds ||
            !form.formState.dirtyFields.resourceIds
          }
        >
          Next
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
