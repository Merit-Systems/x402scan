"use client";

import { Method } from "./method";

import { Tags } from "@/app/(app)/admin/_components/tags";

import type { Resources, Tag } from "@x402scan/scan-db/types";
import type { BazaarMethod } from "@/types/x402";
import { getDescription, type ParsedX402Response } from "@/lib/x402";
import { getResourceMetadataDescription } from "@/lib/resource-auth";
import { cleanExternalText } from "@/lib/utils";
import { X402V2Badge } from "@/app/(app)/admin/_components/x402/v2-badge";

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
    <div className="flex w-0 flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col justify-between gap-4 md:flex-row md:items-center md:gap-0">
        <div className="flex w-full flex-1 items-center gap-2 md:w-auto">
          <Method method={method} />
          <span className="truncate font-mono text-sm">
            {hideOrigin
              ? decodeURIComponent(new URL(resource.resource).pathname)
              : resource.resource}
          </span>
          <Tags tags={tags} />
          {resource.x402Version === 2 && <X402V2Badge />}
        </div>
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
};
