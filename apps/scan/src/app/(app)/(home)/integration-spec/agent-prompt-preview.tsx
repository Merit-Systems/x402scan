'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';

interface AgentPromptPreviewProps {
  prompt: string;
  collapsedLines?: number;
}

export function AgentPromptPreview({
  prompt,
  collapsedLines = 5,
}: AgentPromptPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  const collapsedMaxHeight = useMemo(() => {
    switch (collapsedLines) {
      case 4:
        return 96;
      case 5:
        return 112;
      case 6:
        return 128;
      default:
        return 112;
    }
  }, [collapsedLines]);

  return (
    <div>
      <div className="relative">
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : collapsedMaxHeight }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-md bg-muted"
        >
          <pre
            className={
              expanded
                ? 'p-3 overflow-x-auto text-xs'
                : 'p-3 overflow-hidden text-xs'
            }
          >
            <code>{prompt}</code>
          </pre>
        </motion.div>
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-md bg-gradient-to-t from-muted via-muted/95 to-transparent" />
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
