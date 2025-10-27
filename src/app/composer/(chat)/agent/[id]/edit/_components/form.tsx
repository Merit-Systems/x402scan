'use client';

import { Bot, Plus, X } from 'lucide-react';

import Image from 'next/image';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { Dropzone } from '@/components/ui/dropzone';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { ResourceList } from '../../../../_components/resource-list';

import { api } from '@/trpc/client';

import { agentConfigurationSchema } from '@/services/db/agent-config/mutate/schema';

import { cn } from '@/lib/utils';

import type z from 'zod';

interface Props {
  onSubmit: (data: z.infer<typeof agentConfigurationSchema>) => void;
  isSubmitting: boolean;
  defaultValues?: z.input<typeof agentConfigurationSchema>;
  submitText: {
    default: string;
    submitting: string;
  };
}

export const AgentForm: React.FC<Props> = ({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitText,
}) => {
  const form = useForm({
    resolver: zodResolver(agentConfigurationSchema),
    defaultValues: defaultValues ?? {
      name: '',
      description: '',
      systemPrompt: '',
      resourceIds: [],
    },
    mode: 'onChange',
  });

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
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <FieldSet>
        <FieldLegend>Tools</FieldLegend>
        <FieldGroup className="w-full items-start gap-6 flex flex-col">
          <Controller
            control={form.control}
            name="resourceIds"
            render={({ field }) => (
              <Field>
                <div className="border rounded-md">
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
                </div>
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Display Information</FieldLegend>
        <FieldGroup>
          <FieldGroup className="flex flex-col md:flex-row">
            <Controller
              control={form.control}
              name="image"
              render={({ field }) => (
                <Field className="shrink-0 h-[156px] w-[136px]">
                  <FieldLabel htmlFor="image">Image</FieldLabel>
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
                        className="size-full hover:opacity-80 transition-opacity"
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
                    <FieldLabel htmlFor="name">Name</FieldLabel>
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
                    <FieldLabel htmlFor="description">Description</FieldLabel>
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
              <FieldSet data-invalid={fieldState.invalid}>
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldSet>
            )}
          />
        </FieldGroup>
      </FieldSet>
      <FieldSeparator className="my-0" />
      <FieldSet>
        <FieldLegend>Behavior</FieldLegend>
        <FieldGroup className="w-full items-start gap-6 flex flex-col">
          <Controller
            control={form.control}
            name="systemPrompt"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="systemPrompt">System Prompt</FieldLabel>
                <Textarea
                  id="systemPrompt"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Ex. You are a deep research agent that will email me a report on the latest x402 news each day."
                  rows={8}
                  className="resize-none"
                />
                <FieldDescription>
                  Define how your agent should behave. It is often helpful to
                  articulate how your tools should be used.
                </FieldDescription>
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Starter Prompts</FieldLegend>
        <FieldGroup className="w-full flex flex-col gap-2">
          <Controller
            control={form.control}
            name="starterPrompts"
            defaultValue={defaultValues?.starterPrompts ?? ['']}
            render={({ field }) => {
              console.log(field.value);
              const prompts: string[] = field.value ?? [];
              return (
                <>
                  {prompts.map((value, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={value}
                        onChange={e => {
                          const newPrompts = [...prompts];
                          newPrompts[idx] = e.target.value;
                          field.onChange(newPrompts);
                        }}
                        placeholder={`Starter prompt ${idx + 1}`}
                        disabled={isSubmitting}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newPrompts = prompts.filter(
                            (_, i) => i !== idx
                          );
                          field.onChange(newPrompts);
                        }}
                        disabled={isSubmitting}
                        title="Remove"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => field.onChange([...prompts, ''])}
                    disabled={isSubmitting || prompts.length >= 10}
                    className="w-full"
                  >
                    <Plus className="size-4" />
                    Add
                  </Button>
                  <FieldDescription>
                    Add example messages to help users quickly get started with
                    your agent.
                  </FieldDescription>
                </>
              );
            }}
          />
        </FieldGroup>
      </FieldSet>
      <div className="sticky bottom-0 pb-2 bg-background">
        <Button
          type="submit"
          variant="turbo"
          disabled={!form.formState.isValid || isSubmitting}
          className="w-full h-12 md:h-12 sticky bottom-0"
        >
          {isSubmitting ? submitText.submitting : submitText.default}
        </Button>
      </div>
    </form>
  );
};
