'use client';

import { useParams } from 'next/navigation';
import { findPageLocation } from '../_lib/navigation';

import type { Guide } from '../_lib/mdx';

export const usePageLocation = (guide: Guide) => {
  const params = useParams<{ path: string[] }>();

  const path = params.path ?? [];
  const pageLocation = findPageLocation(guide.items, path);

  return pageLocation;
};
