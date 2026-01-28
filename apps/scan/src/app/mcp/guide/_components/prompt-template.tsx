'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { z } from 'zod';

interface Props<Schema extends z.ZodObject> {
  schema: Schema;
  // template: (props: z.infer<Schema>) => string;
}

export const PromptTemplate = <Schema extends z.ZodObject>({
  schema,
}: Props<Schema>) => {
  const [values, setValues] = useState<z.infer<Schema>>(schema.parse({}));

  return (
    <div className="bg-muted border rounded-xl p-4">
      <h1>Prompt Template</h1>
      {Object.entries(schema.shape).map(([key, value]) => (
        <PromptInput key={key} schema={value as z.ZodString} />
      ))}
      <div className="flex gap-2">
        <Button variant="outline">Edit</Button>
        <Button disabled={schema.safeParse(values).success}>Copy Prompt</Button>
      </div>
    </div>
  );
};

const PromptInput = <Schema extends z.ZodString>({
  schema,
}: {
  schema: Schema;
}) => {
  const meta = schema.meta();
  console.log(meta);
  return <Input type="text" placeholder={meta?.placeholder as string} />;
};
