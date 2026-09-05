"use client";

import { z } from "zod";
import { AlertTriangle, Copy, Check, Shield } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "@/app/(app)/_components/resources/utils";

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

const NO_WARNINGS: string[] = [];

export const ResourceCard: React.FC<Props> = ({
  resource,
  tags,
  response,
  bazaarMethod,
  className,
  hideOrigin = false,
  isFlat = false,
  warnings = NO_WARNINGS,
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
      <Card className={cn(className, "overflow-hidden", !isFlat && " ")}>
        <CardHeader className="flex w-full flex-row items-center justify-between gap-4 space-y-0">
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
                      <span className="type-mono type-emphasis type-scale-caption shrink-0 text-success">
                        Free
                      </span>
                    );
                  case "unprotected":
                    return (
                      <span className="type-mono type-emphasis type-scale-caption shrink-0 text-information">
                        Public
                      </span>
                    );
                  case "apiKey":
                    return (
                      <span className="type-mono type-emphasis type-scale-caption shrink-0 text-muted-foreground">
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
                <TooltipTrigger
                  render={<Shield className="size-4 text-success" />}
                ></TooltipTrigger>
                <TooltipContent side="left">
                  <div className="type-caption">Ownership verified</div>
                </TooltipContent>
              </Tooltip>
            )}
            {warnings.length > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={<AlertTriangle className="size-4 text-warning" />}
                ></TooltipTrigger>
                <TooltipContent side="left" className="max-w-md">
                  <div className="space-y-1 type-caption">
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
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-fit shrink-0 md:size-fit"
                    onClick={() => void copyToClipboard(prompt)}
                  />
                }
              >
                {isCopied ? (
                  <Check className="size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
              </TooltipTrigger>
              <TooltipContent side="left">
                <div className="type-caption">Copy prompt</div>
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
    <span className="type-mono type-emphasis type-scale-caption shrink-0 text-primary">
      {label}
    </span>
  );
};
