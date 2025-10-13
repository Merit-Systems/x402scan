import { createFromSource } from 'fumadocs-core/search/server';

import { source } from '@/lib/docs/source';

export const { GET } = createFromSource(source, {
  language: 'english',
});
