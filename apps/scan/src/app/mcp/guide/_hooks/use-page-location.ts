'use client';

import { useParams } from 'next/navigation';
import { findPageLocation, findSection } from '../_lib/navigation';

import type { Guide } from '../_lib/mdx';

export const usePageLocation = (guide: Guide) => {
  const params = useParams<{ path: string[] }>();

  // Handle empty path (base route) → use 'index'
  let path = params.path?.length ? params.path : ['index'];

  // If the path points to a section, append 'index' to find the section's index page
  const section = findSection(guide.items, path);
  if (section) {
    path = [...path, 'index'];
  }

  const pageLocation = findPageLocation(guide.items, path);

  return pageLocation;
};
