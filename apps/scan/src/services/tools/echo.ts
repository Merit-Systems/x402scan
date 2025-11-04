import z from 'zod';

export const getSoraVideoInputSchema = z.string();

const getSoraVideoOutputSchema = z.object({
  completed_at: z.number().int().nullable(),
  created_at: z.number().int(),
  error: z.record(z.string(), z.any()).nullable(),
  expires_at: z.number().int().nullable(),
  id: z.string(),
  model: z.string(),
  object: z.literal('video'),
  progress: z.number().int(),
  remixed_from_video_id: z.string().nullable(),
  seconds: z.string(),
  size: z.string(),
  status: z.enum([
    'queued',
    'in_progress',
    'completed',
    'failed',
    'cancelled',
    'cancelling',
    'expired',
    'requires_action',
  ]),
});

export const getSoraVideo = async (
  id: z.infer<typeof getSoraVideoInputSchema>
) => {
  const response = await fetch(
    `https://echo.router.merit.systems/v1/videos/${id}`
  );

  return getSoraVideoOutputSchema.parse(await response.json());
};
