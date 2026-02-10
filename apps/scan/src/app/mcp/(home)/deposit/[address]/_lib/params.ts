import z from 'zod';

export const depositSearchParamsSchema = z.object({
  redirectUri: z.string().optional(),
});

export type DepositSearchParams = z.infer<typeof depositSearchParamsSchema>;
