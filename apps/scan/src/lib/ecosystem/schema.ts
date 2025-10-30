import z from 'zod';

export const ecosystemCategories = [
  'Client-Side Integrations',
  'Services/Endpoints',
  'Ecosystem Infrastructure & Tooling',
  'Learning & Community Resources',
] as const;

export type EcosystemCategory = (typeof ecosystemCategories)[number];

export const ecosystemItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  logoUrl: z.string().transform(path => `https://www.x402.org${path}`),
  websiteUrl: z.url(),
  category: z.enum(ecosystemCategories),
});

export type EcosystemItem = z.infer<typeof ecosystemItemSchema>;
