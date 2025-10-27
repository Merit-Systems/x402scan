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
  logoUrl: z.string().transform(path => {
    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // If it starts with /logos/, it's from x402.org ecosystem sync
    if (path.startsWith('/logos/')) {
      return `https://www.x402.org${path}`;
    }
    // Otherwise, it's a local file in Next.js public/ directory - keep as-is
    return path;
  }),
  websiteUrl: z.url(),
  category: z.enum(ecosystemCategories),
});

export type EcosystemItem = z.infer<typeof ecosystemItemSchema>;
