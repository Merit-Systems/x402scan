"use client";

import { z } from "zod";
import { AlertTriangle, Copy, Check, Shield } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Header } from "./header/index";
import {
  formatPricingLabel,
  getMaxUsdcAmount,
  getResourceAuthMode,
} from "./utils";

import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { toast } from "sonner";

import type { BazaarMethod } from "@/types/x402";
import type { ParsedX402Response } from "@/lib/x402";
import type { Resources, Tag } from "@x402scan/scan-db";

interface SerializedAccept {
  maxAmountRequired: number;
  network: string;
  scheme: string;
  asset?: string | null;
}

/** The pricing-display fields of a resource's untyped metadata JSON. */
const pricingMetadataSchema = z.looseObject({
  pricingMode: z.string().optional().catch(undefined),
  price: z.string().optional().catch(undefined),
});

interface Props {
  resource: Resources;
  tags: Tag[];
  response: ParsedX402Response;
  bazaarMethod: BazaarMethod;
  className?: string;
  hideOrigin?: boolean;
  isFlat?: boolean;
  warnings?: string[];
  ownershipVerified?: boolean;
  accepts?: SerializedAccept[];
}

export const ResourceCard: React.FC<Props> = ({
  resource,
  tags,
  response,
  bazaarMethod,
  className,
  hideOrigin = false,
  isFlat = false,
  warnings = [],
  ownershipVerified = false,
  accepts,
}) => {
  const prompt = `Use agentcash.dev to test out this resource's endpoint: ${bazaarMethod} ${resource.resource}`;
  const pricingMetadata = pricingMetadataSchema.safeParse(resource.metadata);
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success("Prompt copied to clipboard");
  });

  return (
    <div className={cn("pt-4 relative", !isFlat && "pl-4 border-l")}>
      {!isFlat && (
        <div className="absolute top-[calc(2rem+5px)] left-0 h-px w-4 bg-border" />
      )}
      <Card
        className={cn(
          className,
          "overflow-hidden",
          !isFlat && "border-0 shadow-none"
        )}
      >
        <CardHeader className="flex w-full flex-row items-center justify-between gap-4 space-y-0 bg-muted px-4 py-2">
          <Header
            resource={resource}
            tags={tags}
            method={bazaarMethod}
            response={response}
            hideOrigin={hideOrigin}
          />
          <div className="flex items-center gap-2">
            {accepts && accepts.length > 0 ? (
              <ResourcePricing
                accepts={accepts}
                pricingMode={
                  pricingMetadata.success &&
                  pricingMetadata.data.pricingMode === "dynamic"
                    ? "dynamic"
                    : undefined
                }
                price={
                  pricingMetadata.success
                    ? pricingMetadata.data.price
                    : undefined
                }
              />
            ) : (
              (() => {
                switch (getResourceAuthMode(resource.metadata)) {
                  case "siwx":
                    return (
                      <span className="shrink-0 font-mono text-xs font-semibold text-green-600">
                        Free
                      </span>
                    );
                  case "unprotected":
                    return (
                      <span className="shrink-0 font-mono text-xs font-semibold text-sky-600">
                        Public
                      </span>
                    );
                  case "apiKey":
                    return (
                      <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                        API key
                      </span>
                    );
                  default:
                    return null;
                }
              })()
            )}
            {ownershipVerified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Shield className="size-4 text-green-600" />
                </TooltipTrigger>
                <TooltipContent side="left">
                  <div className="text-xs">Ownership verified</div>
                </TooltipContent>
              </Tooltip>
            )}
            {warnings.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="size-4 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-md">
                  <div className="space-y-1 text-xs">
                    {warnings.map((warning, i) => (
                      <div key={i} className="break-all text-muted-foreground">
                        {warning}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-fit shrink-0 p-2 md:size-fit"
                  onClick={() => void copyToClipboard(prompt)}
                >
                  {isCopied ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <div className="text-xs">Copy prompt</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

const ResourcePricing: React.FC<{
  accepts: SerializedAccept[];
  pricingMode?: string;
  price?: string;
}> = ({ accepts, pricingMode, price }) => {
  const isDynamic =
    pricingMode === "dynamic" || accepts.some((a) => a.scheme !== "exact");
  const maxUsdAmount = getMaxUsdcAmount(accepts);
  const label = formatPricingLabel({ maxUsdAmount, isDynamic, price });

  return (
    <span className="shrink-0 font-mono text-xs font-semibold text-primary">
      {label}
    </span>
  );
};

export const LoadingResourceCard = () => {
  return (
    <Card className="flex w-full cursor-pointer items-stretch overflow-hidden transition-colors hover:border-primary">
      <div className="flex-1">
        <CardHeader className="flex w-full flex-row items-center justify-between gap-4 space-y-0 bg-muted p-0 px-4 py-2 transition-colors hover:border-primary">
          <div className="flex w-0 flex-1 flex-col gap-2">
            <div className="flex flex-1 flex-col justify-between gap-4 md:flex-row md:items-center md:gap-0">
              <div className="flex w-full flex-1 items-center gap-2 md:w-auto">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-[16px] w-36 md:h-[18px]" />
              </div>
            </div>
            <Skeleton className="h-[12px] w-full md:h-[14px]" />
          </div>
        </CardHeader>
      </div>
    </Card>
  );
};
