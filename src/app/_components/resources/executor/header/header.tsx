'use client';

import { Method } from './method';

import type { Resources } from '@prisma/client';
import type { Methods } from '@/types/x402';
import type { ParsedX402Response } from '@/lib/x402/schema';

interface Props {
  resource: Resources;
  method: Methods;
  response: ParsedX402Response;
}

export const Header: React.FC<Props> = ({ resource, method, response }) => {
  return (
    <div className="flex-1 flex flex-col gap-2 w-0">
      <div className="flex md:items-center justify-between flex-col md:flex-row gap-4 md:gap-0 flex-1">
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <Method method={method} />
          <span className="font-mono text-sm truncate">
            {resource.resource}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {response.accepts && response.accepts.length > 0
          ? response.accepts[0].description
          : null}
      </p>
    </div>
  );
};
