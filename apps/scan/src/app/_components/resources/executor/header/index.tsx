'use client';

import { Method } from './method';

import { Tags } from '@/app/_components/tags';
import { formatTokenAmount } from '@/lib/token';

import type { Resources, Tag } from '@x402scan/scan-db/types';
import type { Methods } from '@/types/x402';
import { getDescription, type ParsedX402Response } from '@/lib/x402';

interface Props {
  resource: Resources;
  tags: Tag[];
  method: Methods;
  response: ParsedX402Response;
  hideOrigin?: boolean;
}

export const Header: React.FC<Props> = ({
  resource,
  tags,
  method,
  response,
  hideOrigin = false,
}) => {
  // Extract the amount from the first accept option
  const accept = response.accepts?.[0];
  const maxAmountRequired = accept?.maxAmountRequired
    ? BigInt(accept.maxAmountRequired)
    : null;

  return (
    <div className="flex-1 flex flex-col gap-2 w-0">
      <div className="flex md:items-center justify-between flex-col md:flex-row gap-4 md:gap-0 flex-1">
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <Method method={method} />
          <span className="font-mono text-sm truncate">
            {hideOrigin
              ? new URL(resource.resource).pathname
              : resource.resource}
          </span>
          <Tags tags={tags} />
          {maxAmountRequired !== null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {formatTokenAmount(maxAmountRequired)} USDC
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {getDescription(response)}
      </p>
    </div>
  );
};
