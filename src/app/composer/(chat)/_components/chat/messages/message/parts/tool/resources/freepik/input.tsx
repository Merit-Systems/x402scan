import { Image as ImageIcon } from 'lucide-react';

import z from 'zod';

import type { InputComponent } from '../types';

const schema = z.object({
  prompt: z.string(),
  model: z.string().optional(),
});

export const FreepikInput: InputComponent = ({ input }) => {
  const parseResult = schema.safeParse(input);

  if (!parseResult.success) {
    return <div>Invalid input</div>;
  }

  const { prompt, model } = parseResult.data;

  return (
    <div className="flex items-center gap-2">
      <ImageIcon className="size-4 shrink-0" />
      <p className="text-sm font-medium">
        {prompt}{' '}
        {model ? (
          <span className="text-muted-foreground text-xs">({model})</span>
        ) : (
          ''
        )}
      </p>
    </div>
  );
};
