import type { OgImage, ResourceOrigin, Resources } from '@prisma/client';

export function createDummyOgImage(params: {
  id: string;
  originId: string;
  url: string;
  title: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
}): OgImage {
  return {
    id: params.id,
    originId: params.originId,
    url: params.url,
    title: params.title ?? null,
    description: params.description ?? null,
    width: params.width ?? null,
    height: params.height ?? null,
  };
}

export function createDummyResourceOrigin(params: {
  id: string;
  origin: string;
  title: string | null;
  description: string | null;
  favicon: string | null;
  ogImages: OgImage[];
}): ResourceOrigin & { ogImages: OgImage[] } {
  return {
    id: params.id,
    origin: params.origin,
    title: params.title ?? null,
    description: params.description ?? null,
    favicon: params.favicon ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ogImages: params.ogImages,
  };
}

export function createDummyResources(params: {
  id: string;
  resource: string;
  originId: string;
  x402Version: number;
}): Resources {
  return {
    id: params.id,
    resource: params.resource,
    type: 'http',
    x402Version: params.x402Version,
    lastUpdated: new Date(),
    metadata: null,
    originId: params.originId,
  } as Resources;
}
