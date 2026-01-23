import type { OutputComponent } from '../types';

import z from 'zod';

const aiBeatsOrigin = 'https://www.aibeats.fun';

const aibeatsOutputSchema = z.object({
  success: z.literal(true),
  result: z.object({
    audioUrl: z
      .string()
      .transform(url => new URL(url, aiBeatsOrigin).toString()),
    fileName: z.string(),
    finalLyrics: z.string(),
    aiTitle: z.string(),
    artwork: z
      .object({
        fileName: z.string(),
        imageUrl: z
          .string()
          .transform(url => new URL(url, aiBeatsOrigin).toString()),
        prompt: z.string(),
      })
      .nullable(),
    metadata: z.object({
      originalPrompt: z.string(),
      enhancedPrompt: z.string(),
      duration: z.number(),
      fileSize: z.number(),
      format: z.string(),
      sampleRate: z.number(),
      bitrate: z.number(),
    }),
  }),
  usage: z.object({
    totalCost: z.number().optional(),
    paymentMethod: z.string(),
    remainingCredits: z.number().optional(),
  }),
});

export const AibeatsOutput: OutputComponent = ({ output, errorText }) => {
  if (errorText) {
    return <div className="text-destructive text-sm">{errorText}</div>;
  }

  const parseResult = aibeatsOutputSchema.safeParse(output);

  if (!parseResult.success) {
    console.error(parseResult.error);
    return <p>Error parsing output</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <audio controls src={parseResult.data.result.audioUrl} className="w-full">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
