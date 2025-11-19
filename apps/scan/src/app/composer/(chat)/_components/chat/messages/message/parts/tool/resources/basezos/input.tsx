import { Search } from 'lucide-react';

import z from 'zod';

import type { InputComponent } from '../types';

const schema = z.object({
  searchQuery: z.string().min(1),
  pages: z.coerce.number().int().min(1).max(10).default(1),
});

export const BasezosInput: InputComponent = ({ input }) => {
  const parseResult = schema.safeParse(input);

  if (!parseResult.success) {
    return <div>Invalid input</div>;
  }

  const { searchQuery, pages } = parseResult.data;

  return (
    <div className="flex items-center gap-2">
      <Search className="size-4 shrink-0" />
      <p className="text-sm font-medium">
        {searchQuery}{' '}
        {pages > 1 ? (
          <span className="text-muted-foreground text-xs">
            ({pages} page{pages > 1 ? 's' : ''})
          </span>
        ) : (
          ''
        )}
      </p>
    </div>
  );
};
