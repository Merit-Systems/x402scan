import { env } from '@/env';
import z from 'zod';

export const fetchFreepikMysticTaskInputSchema = z.object({
  task_id: z.string(),
});

const fetchFreepikMysticTaskOutputSchema = z.object({
  data: z.object({
    task_id: z.string(),
    status: z.enum(['CREATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
    generated: z.array(z.url()),
  }),
});

export async function fetchFreepikMysticTask({
  task_id,
}: z.infer<typeof fetchFreepikMysticTaskInputSchema>) {
  if (!env.FREEPIK_API_KEY) throw new Error('FREEPIK_API_KEY is not set');

  const endpoint = `https://api.freepik.com/v1/ai/mystic/${task_id}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'x-freepik-api-key': env.FREEPIK_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch Freepik Mystic task: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return fetchFreepikMysticTaskOutputSchema.parse(await response.json());
}
