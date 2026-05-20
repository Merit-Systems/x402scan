import type { MetadataRoute } from 'next';

import { scanDb } from '@x402scan/scan-db';

import { env } from '@/env';
import { facilitators } from '@/lib/facilitators';

const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
const staticLastModified = new Date('2026-05-20T00:00:00.000Z');

const url = (path: string) => `${baseUrl}${path}`;

const staticRouteEntries = [
  { url: url('/'), changeFrequency: 'hourly', priority: 1 },
  { url: url('/x402'), changeFrequency: 'daily', priority: 0.95 },
  {
    url: url('/agentic-commerce'),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  { url: url('/transactions'), changeFrequency: 'hourly', priority: 0.8 },
  { url: url('/resources'), changeFrequency: 'daily', priority: 0.8 },
  { url: url('/resources/register'), changeFrequency: 'weekly', priority: 0.7 },
  { url: url('/discovery'), changeFrequency: 'weekly', priority: 0.75 },
  {
    url: url('/discovery/quickstart'),
    changeFrequency: 'weekly',
    priority: 0.65,
  },
  { url: url('/discovery/spec'), changeFrequency: 'weekly', priority: 0.7 },
  {
    url: url('/discovery/architecture'),
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  { url: url('/all'), changeFrequency: 'daily', priority: 0.65 },
  { url: url('/networks'), changeFrequency: 'daily', priority: 0.6 },
  { url: url('/ecosystem'), changeFrequency: 'daily', priority: 0.6 },
  { url: url('/facilitators'), changeFrequency: 'daily', priority: 0.6 },
  { url: url('/mcp'), changeFrequency: 'weekly', priority: 0.55 },
  { url: url('/mcp/guide'), changeFrequency: 'weekly', priority: 0.5 },
  { url: url('/composer'), changeFrequency: 'daily', priority: 0.45 },
  { url: url('/developer'), changeFrequency: 'daily', priority: 0.4 },
] satisfies Omit<MetadataRoute.Sitemap[number], 'lastModified'>[];

const staticRoutes: MetadataRoute.Sitemap = staticRouteEntries.map(route => ({
  lastModified: staticLastModified,
  ...route,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origins = await scanDb.resourceOrigin.findMany({
    where: {
      resources: {
        some: {
          deprecatedAt: null,
          response: {
            isNot: null,
          },
          accepts: {
            some: {},
          },
        },
      },
    },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 1000,
  });

  const serverRoutes: MetadataRoute.Sitemap = origins.map(origin => ({
    url: url(`/server/${origin.id}`),
    lastModified: origin.updatedAt,
    changeFrequency: 'daily',
    priority: 0.55,
  }));

  const facilitatorRoutes: MetadataRoute.Sitemap = facilitators.map(
    facilitator => ({
      url: url(`/facilitator/${facilitator.id}`),
      lastModified: staticLastModified,
      changeFrequency: 'daily',
      priority: 0.5,
    })
  );

  return [...staticRoutes, ...serverRoutes, ...facilitatorRoutes];
}
