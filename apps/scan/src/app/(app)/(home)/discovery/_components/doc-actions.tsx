import Link from "next/link";
import { Plus } from "lucide-react";

import type { Route } from "next";

import { buttonVariants } from "@/components/ui/button";

export function DiscoveryDocActions({
  secondaryHref,
  secondaryLabel,
}: DiscoveryDocActionsProps) {
  return (
    <>
      <div className="mt-8 flex items-center gap-2" data-not-typeset>
        <Link
          href="/resources/register"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="size-3.5" />
          Add your API
        </Link>
        <Link
          href={secondaryHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {secondaryLabel}
        </Link>
      </div>

      <p>
        For further questions, contact us at{" "}
        <a href="mailto:merchants@merit.systems">merchants@merit.systems</a>.
      </p>
    </>
  );
}

interface DiscoveryDocActionsProps {
  secondaryHref: Route;
  secondaryLabel: string;
}
