import Link from "next/link";

import { cn } from "@/lib/utils";

import { DiscoveryActions } from "./discovery-actions";

export function DiscoveryFixHint({
  className,
  failedResources,
  warnings,
  noDiscovery,
  missingSchemaResources,
  missingContactEmail,
}: {
  className?: string;
  failedResources?: { url: string; error: string; status?: number }[];
  warnings?: { url: string; error: string; status?: number }[];
  noDiscovery?: boolean;
  missingSchemaResources?: string[];
  missingContactEmail?: boolean;
}) {
  const label = noDiscovery
    ? "Have your agent create an OpenAPI spec for your resource"
    : "Have your agent fix the issues with a prompt";

  return (
    <p className={cn("type-supporting-body text-foreground", className)}>
      <DiscoveryActions
        label={label}
        failedResources={failedResources}
        warnings={warnings}
        missingSchemaResources={missingSchemaResources}
        missingContactEmail={missingContactEmail}
        noDiscovery={noDiscovery}
      />{" "}
      or{" "}
      <Link
        href="/discovery/spec"
        className="underline underline-offset-2 transition-colors hover:text-foreground"
      >
        read the discovery spec
      </Link>
    </p>
  );
}
