import { z } from "zod";

import { Skeleton } from "@/components/ui/skeleton";

import {
  formatPricingLabel,
  getBazaarMethod,
  getMaxUsdcAmount,
  getResourceAuthMode,
  toBazaarMethod,
} from "@/app/(app)/_components/resources/utils";
import { getResourceMetadataDescription } from "@/lib/resource-auth";
import { serializeAccepts } from "@/lib/token";
import { cleanExternalText, cn } from "@/lib/utils";
import { getDescription } from "@/lib/x402";
import {
  listOriginsWithResources,
  listOriginsWithResourcesSchema,
} from "@/services/db/resources/origin";

import { CopyRoute } from "./copy-route";

type Resource = Awaited<
  ReturnType<typeof listOriginsWithResources>
>[number]["resources"][number];

const pricingMetadataSchema = z.looseObject({
  pricingMode: z.string().optional().catch(undefined),
  price: z.string().optional().catch(undefined),
});

interface OriginResourcesProps {
  originId: string;
}

export async function OriginResources({ originId }: OriginResourcesProps) {
  const [origin] = await listOriginsWithResources(
    listOriginsWithResourcesSchema.parse({
      originIds: [originId],
    })
  );
  const resources = (origin?.resources ?? []).filter(
    (resource) => resource.success
  );

  return (
    <section className="space-y-4">
      <h2 className="type-section-title">Resources</h2>
      <div className="divide-y divide-border">
        {resources.length === 0 ? (
          <p className="type-supporting-body rounded-md py-4 text-muted-foreground">
            No resources found
          </p>
        ) : null}
        {resources.map((resource) => (
          <ResourceRow key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}

interface ResourceRowProps {
  resource: Resource;
}

function ResourceRow({ resource }: ResourceRowProps) {
  if (!resource.success) {
    return null;
  }

  const rawOutputSchema = resource.accepts.find(
    (accept) => accept.outputSchema
  )?.outputSchema;
  const method =
    toBazaarMethod(resource.method) ?? getBazaarMethod(rawOutputSchema);
  const description =
    getDescription(resource.data) ??
    getResourceMetadataDescription(resource.metadata);

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <MethodBadge method={method} />
          <CopyRoute
            resourceUrl={resource.resource}
            route={resourcePath(resource.resource)}
          />
          <ResourcePrice resource={resource} />
        </div>
        {description ? (
          <p className="line-clamp-2 type-caption text-muted-foreground">
            {cleanExternalText(description)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface ResourcePriceProps {
  resource: Resource;
}

function ResourcePrice({ resource }: ResourcePriceProps) {
  const accepts = serializeAccepts(resource.accepts);

  if (accepts.length > 0) {
    const pricingMetadata = pricingMetadataSchema.safeParse(resource.metadata);
    const isDynamic =
      (pricingMetadata.success &&
        pricingMetadata.data.pricingMode === "dynamic") ||
      accepts.some((accept) => accept.scheme !== "exact");

    return (
      <span className="type-compact-code shrink-0 text-muted-foreground/80">
        {formatPricingLabel({
          maxUsdAmount: getMaxUsdcAmount(accepts),
          isDynamic,
          price: pricingMetadata.success
            ? pricingMetadata.data.price
            : undefined,
        })}
      </span>
    );
  }

  const authMode = getResourceAuthMode(resource.metadata);
  const label =
    authMode === "unprotected"
      ? "Public"
      : authMode === "apiKey"
        ? "API key"
        : authMode === "siwx"
          ? "Free"
          : null;

  return label ? (
    <span
      className={cn(
        "shrink-0 type-compact-code text-muted-foreground/80 uppercase",
        authMode === "unprotected" && "text-information"
      )}
    >
      {label}
    </span>
  ) : null;
}

interface MethodBadgeProps {
  method: string;
}

function MethodBadge({ method }: MethodBadgeProps) {
  const normalizedMethod = method.toUpperCase();

  return (
    <span
      className={cn(
        methodClassName(normalizedMethod),
        "rounded-md px-2 py-1 type-compact-code"
      )}
    >
      {normalizedMethod}
    </span>
  );
}

function methodClassName(method: string) {
  switch (method) {
    case "GET":
      return "bg-success-subtle text-success";
    case "POST":
      return "bg-information-subtle text-information";
    case "PUT":
      return "bg-warning-subtle text-warning";
    case "DELETE":
      return "bg-destructive-subtle text-destructive";
    case "PATCH":
      return "bg-primary/10 text-primary";
    case "OPTIONS":
    case "HEAD":
      return "bg-muted text-muted-foreground";
    default:
      return undefined;
  }
}

function resourcePath(resource: string) {
  try {
    const url = new URL(resource);
    return decodeURIComponent(`${url.pathname}${url.search}`);
  } catch {
    return resource;
  }
}

export function LoadingOriginResources() {
  return (
    <section aria-busy="true" className="space-y-4">
      <h2 className="type-section-title">Resources</h2>
      <div className="divide-y divide-border">
        <LoadingResourceRow />
        <LoadingResourceRow />
      </div>
    </section>
  );
}

function LoadingResourceRow() {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-14 rounded-md" />
          <Skeleton className="h-5 w-56 max-w-full" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
