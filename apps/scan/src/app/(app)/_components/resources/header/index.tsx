'use client';

import { Method } from './method';

import { Tags } from '@/app/(app)/_components/tags';

import type { Resources, Tag } from '@x402scan/scan-db/types';
import type { BazaarMethod } from '@/types/x402';
import { getDescription, type ParsedX402Response } from '@/lib/x402';
import { getResourceMetadataDescription } from '@/lib/resource-auth';
import { cleanExternalText } from '@/lib/utils';
import { X402V2Badge } from '@/app/(app)/_components/x402/v2-badge';

interface Props {
  resource: Resources;
  tags: Tag[];
  method: BazaarMethod;
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
  // Free resources have no 402 response to describe them; paid ones may
  // omit accepts descriptions (or carry an empty string). Fall back to the
  // description captured from the origin's openapi spec at registration.
  const responseDescription = getDescription(response);
  const metadataDescription = getResourceMetadataDescription(resource.metadata);
  const description = responseDescription?.length
    ? responseDescription
    : metadataDescription
      ? cleanExternalText(metadataDescription)
      : undefined;
  return (
    <div className="flex-1 flex flex-col gap-2 w-0">
      <div className="flex md:items-center justify-between flex-col md:flex-row gap-4 md:gap-0 flex-1">
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <Method method={method} />
          <span className="font-mono text-sm truncate">
            {hideOrigin
              ? decodeURIComponent(new URL(resource.resource).pathname)
              : resource.resource}
          </span>
          <Tags tags={tags} />
          {resource.x402Version === 2 && <X402V2Badge />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {description}
      </p>
    </div>
  );
};
