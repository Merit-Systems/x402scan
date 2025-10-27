import { Music } from 'lucide-react';

import z from 'zod';

import type { InputComponent } from '../types';

const schema = z.object({
  prompt: z.string({
    error: 'Prompt is required',
  }),
  lyrics: z.string().optional(),
  enhancePrompt: z.boolean().optional(),
  generateArtwork: z.boolean().optional(),
});

export const AibeatsInput: InputComponent = ({ input }) => {
  const parseResult = schema.safeParse(input);

  if (!parseResult.success) {
    return <div>Invalid input</div>;
  }

  const { prompt } = parseResult.data;

  return (
    <div className="flex items-center gap-2">
      <Music className="size-4 shrink-0" />
      <p className="text-sm font-medium">{prompt}</p>
    </div>
  );
};
