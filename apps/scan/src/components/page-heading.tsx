import type { ReactNode } from "react";

interface PageHeadingProps {
  actions?: ReactNode;
  title: string;
  description: string;
}

export function PageHeading({ actions, title, description }: PageHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="type-page-title">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
