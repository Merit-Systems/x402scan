import { Video } from 'lucide-react';

import z from 'zod';

import type { InputComponent } from '../../types';

const schema = z.object({
  size: z
    .enum(['720x1280', '1280x720', '1024x1792', '1792x1024'])
    .default('1280x720'),
  model: z.enum(['sora-2', 'sora-2-pro']).default('sora-2'),
  prompt: z.string(),
  seconds: z.enum(['4', '8', '12']).optional(),
});

export const SoraInput: InputComponent = ({ input }) => {
  const parseResult = schema.safeParse(input);

  if (!parseResult.success) {
    return <div>Invalid input</div>;
  }

  const { prompt, seconds } = parseResult.data;

  return (
    <div className="flex items-center gap-2">
      <Video className="size-4 shrink-0" />
      <p className="text-sm font-medium">
        {prompt}{' '}
        {seconds ? (
          <span className="text-muted-foreground text-xs">
            ({seconds} seconds)
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">(4 seconds)</span>
        )}
      </p>
    </div>
  );
};
