import Image from 'next/image';

import { Controller } from 'react-hook-form';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import type { NewAgentForm } from './types';
import { Dropzone } from '@/components/ui/dropzone';
import { toast } from 'sonner';
import { api } from '@/trpc/client';
import { cn } from '@/lib/utils';
import { ArrowLeft, Bot, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

interface Props {
  form: NewAgentForm;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export const DisplayStep: React.FC<Props> = ({
  form,
  onPrevious,
  isSubmitting,
}) => {
  const { mutate: uploadImage, isPending: isUploading } =
    api.user.upload.image.useMutation({
      onSuccess: ({ url }) => {
        form.setValue('image', url, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      },
    });

  return (
    <div>
      <FieldGroup className="p-4">
        <FieldGroup className="flex flex-col md:flex-row">
          <Controller
            control={form.control}
            name="image"
            render={({ field }) => (
              <Field className="shrink-0 h-[156px] w-[136px]">
                <FieldLabel htmlFor="image">
                  <span>
                    Image{' '}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </span>
                </FieldLabel>
                <Dropzone
                  accept={{
                    'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
                  }}
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  onDrop={async files => {
                    if (files.length === 0) {
                      toast.error('No file selected');
                      return;
                    }
                    uploadImage(files[0]);
                  }}
                  disabled={isUploading}
                  className={cn(
                    'flex-1 p-0 flex flex-col items-center justify-center gap-1 overflow-hidden bg-transparent',
                    field.value && 'border-none shadow-none'
                  )}
                >
                  {field.value ? (
                    <Image
                      src={field.value}
                      alt="Profile Picture"
                      width={96}
                      height={96}
                      className="size-full rounded-md hover:opacity-80 transition-opacity"
                      unoptimized
                    />
                  ) : (
                    <Bot className="size-16" />
                  )}
                </Dropzone>
              </Field>
            )}
          />
          <FieldGroup className="flex-1">
            <Controller
              control={form.control}
              name="name"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="name">
                    <span>
                      Name{' '}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </span>
                  </FieldLabel>
                  <Input
                    id="name"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Ex. Deep Research Agent"
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="description">
                    <span>
                      Description{' '}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </span>
                  </FieldLabel>
                  <Textarea
                    id="systemPrompt"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Ex. A deep research agent with emailing capabilities"
                    rows={8}
                    className="resize-none"
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </FieldGroup>
        <Controller
          name="visibility"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Visibility</FieldLabel>
              <RadioGroup
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                aria-invalid={fieldState.invalid}
                className="flex flex-row gap-2"
              >
                {[
                  {
                    value: 'public',
                    title: 'Public',
                    description:
                      'Your agent will be discoverable by other users.',
                  },
                  {
                    value: 'private',
                    title: 'Private',
                    description: 'Your agent will only be accessible to you.',
                  },
                ].map(option => (
                  <FieldLabel
                    key={option.value.toString()}
                    htmlFor={`form-rhf-radiogroup-${option.value.toString()}`}
                  >
                    <Field
                      orientation="horizontal"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldContent>
                        <FieldTitle>{option.title}</FieldTitle>
                        <FieldDescription>
                          {option.description}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`form-rhf-radiogroup-${option.value}`}
                        aria-invalid={fieldState.invalid}
                      />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <div className="flex justify-between p-4 border-t bg-muted">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          variant="turbo"
          type="submit"
          disabled={!form.formState.isValid || isSubmitting}
        >
          Create Agent
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
