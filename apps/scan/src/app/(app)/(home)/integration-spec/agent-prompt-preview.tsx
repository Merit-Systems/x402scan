'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

interface AgentPromptPreviewProps {
  prompt: string;
  collapsedLines?: number;
}

export function AgentPromptPreview({
  prompt,
  collapsedLines = 9,
}: AgentPromptPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  const maxHeightClass = useMemo(() => {
    switch (collapsedLines) {
      case 7:
        return 'max-h-40';
      case 8:
        return 'max-h-44';
      case 9:
      default:
        return 'max-h-48';
    }
  }, [collapsedLines]);

  return (
    <div>
      <div className="relative">
        <pre
          className={cn(
            'rounded-md bg-muted p-3 overflow-x-auto text-xs md:text-sm',
            !expanded && maxHeightClass
          )}
        >
          <code>{prompt}</code>
        </pre>
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 rounded-b-md bg-gradient-to-t from-muted via-muted/95 to-transparent" />
        )}
      </div>
      <div className="mt-1 flex justify-end">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? 'Show less' : 'Show full prompt'}
        </button>
      </div>
    </div>
  );
}
