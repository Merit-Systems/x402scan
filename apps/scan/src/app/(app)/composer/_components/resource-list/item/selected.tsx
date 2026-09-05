"use client";

import { AlertTriangle } from "lucide-react";

import { api } from "@/trpc/client";
import { CommandItem } from "@/components/ui/command";

import { BaseResourceItem, LoadingBaseResourceItem } from "./base";

import type { SelectedResource } from "../../../_types/chat-config";

interface Props {
  id: string;
  onSelectResource: (resource: SelectedResource) => void;
}

export const SelectedResourceItem: React.FC<Props> = ({
  id,
  onSelectResource,
}) => {
  const { data: tool, isLoading: isToolLoading } =
    api.public.tools.search.useQuery({
      resourceIds: [id],
      limit: 1,
    });

  if (isToolLoading) {
    return <LoadingBaseResourceItem />;
  }

  const firstTool = tool?.[0];

  if (!firstTool) {
    return (
      <CommandItem
        onSelect={() => {
          onSelectResource({ id, favicon: "" });
        }}
        className="flex items-center justify-between gap-3"
        value={id}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <AlertTriangle className="size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-1 flex-col items-start gap-0 overflow-hidden">
            <h3 className="line-clamp-1 w-full max-w-full truncate type-card-title">
              Unsupported resource
            </h3>
            <p className="line-clamp-2 type-caption text-muted-foreground">
              {id}
            </p>
          </div>
        </div>
      </CommandItem>
    );
  }

  return (
    <BaseResourceItem
      resource={firstTool}
      isSelected={true}
      onSelectResource={onSelectResource}
    />
  );
};
