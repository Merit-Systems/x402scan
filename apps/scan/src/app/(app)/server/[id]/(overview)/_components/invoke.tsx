import { CodeCard } from "@/components/ui/code-card";
import { Skeleton } from "@/components/ui/skeleton";

import type { CodeCardProps } from "@/components/ui/code-card";

interface InstallCommandProps {
  serverUrl: string;
}

export function InstallCommand({ serverUrl }: InstallCommandProps) {
  const props = {
    className: "w-fit max-w-full",
    code: `npx agentcash add ${serverUrl}`,
    codeClassName: "text-wrap whitespace-pre-wrap",
    highlight: "command",
  } satisfies CodeCardProps;

  return <CodeCard {...props} />;
}

export function LoadingInstallCommand() {
  return <Skeleton className="h-14 w-80 max-w-full rounded-xl" />;
}
