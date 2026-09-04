import type { ReactNode } from "react";

import { Typeset, TypesetLead } from "@/components/ui/typeset";

export function DiscoveryPageHeader({
  title,
  description,
  children,
}: DiscoveryPageHeaderProps) {
  return (
    <header className="mb-12 flex flex-wrap items-center justify-between gap-6 border-b pb-10">
      <Typeset>
        <h1>{title}</h1>
        <TypesetLead>{description}</TypesetLead>
      </Typeset>
      {children && (
        <div className="flex flex-wrap items-center gap-2" data-not-typeset>
          {children}
        </div>
      )}
    </header>
  );
}

interface DiscoveryPageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}
