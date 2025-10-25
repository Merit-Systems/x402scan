import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { OutputComponent } from '../types';

import z from 'zod';
import { ChevronDownIcon } from 'lucide-react';

const firecrawlOutputSchema = z.object({
  success: z.literal(true),
  data: z.object({
    web: z.array(
      z.object({
        url: z.string().url(),
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
    return <div className="text-destructive text-sm">{errorText}</div>;
  }

  const parseResult = firecrawlOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return <p>Error parsing output</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {parseResult.data.data.web.slice(0, 3).map(item => (
        <div key={item.url} className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold break-all">
            {item.title || item.url}
          </h3>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
          <div className="text-[10px] text-muted-foreground mt-auto">
            <span className="font-mono">{item.url}</span>
          </div>
        </div>
      ))}
      {/* Collapsible for the rest of the results */}
      {parseResult.data.data.web.length > 3 && (
        <Collapsible className="mt-2">
          <CollapsibleTrigger className="text-xs cursor-pointer text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            Show all results ({parseResult.data.data.web.length - 3} more){' '}
            <ChevronDownIcon className="size-3" />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 mt-2">
            {parseResult.data.data.web.slice(3).map(item => (
              <div key={item.url} className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold break-all">
                  {item.title || item.url}
                </h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
                <div className="text-[10px] text-muted-foreground mt-auto">
                  <span className="font-mono">{item.url}</span>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
