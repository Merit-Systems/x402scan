import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { OutputComponent } from "../types";

import z from "zod";
import { ChevronDownIcon } from "lucide-react";
import { ToolOutput } from "@/components/ai-elements/tool";

const firecrawlOutputSchema = z.object({
  success: z.literal(true),
  data: z.object({
    web: z.array(
      z.object({
        url: z.url(),
        title: z.string(),
        description: z.string(),
        position: z.number(),
      })
    ),
  }),
  creditsUsed: z.number(),
});

export const FirecrawlOutput: OutputComponent = ({ output, errorText }) => {
  if (errorText) {
    return (
      <div className="type-supporting-body text-destructive">{errorText}</div>
    );
  }

  const parseResult = firecrawlOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return <ToolOutput output={JSON.stringify(output)} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {parseResult.data.data.web.slice(0, 3).map((item) => (
        <div key={item.url} className="flex flex-col gap-1">
          <h3 className="type-card-title break-all">
            {item.title || item.url}
          </h3>
          {item.description && (
            <p className="type-caption text-muted-foreground">
              {item.description}
            </p>
          )}
          <div className="type-micro mt-auto text-muted-foreground">
            <span className="type-mono type-scale-body">{item.url}</span>
          </div>
        </div>
      ))}
      {/* Collapsible for the rest of the results */}
      {parseResult.data.data.web.length > 3 && (
        <Collapsible className="mt-2">
          <CollapsibleTrigger className="flex cursor-pointer items-center gap-2">
            Show all results ({parseResult.data.data.web.length - 3} more){" "}
            <ChevronDownIcon className="size-3" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 flex flex-col gap-2">
            {parseResult.data.data.web.slice(3).map((item) => (
              <div key={item.url} className="flex flex-col gap-1">
                <h3 className="type-card-title break-all">
                  {item.title || item.url}
                </h3>
                {item.description && (
                  <p className="type-caption text-muted-foreground">
                    {item.description}
                  </p>
                )}
                <div className="type-micro mt-auto text-muted-foreground">
                  <span className="type-mono type-scale-body">{item.url}</span>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
