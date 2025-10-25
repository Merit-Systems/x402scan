import {
  SourcesTrigger,
  Sources,
  SourcesContent,
  Source,
} from '@/components/ai-elements/sources';

import type { SourceUrlUIPart } from 'ai';

interface Props {
  parts: SourceUrlUIPart[];
}

export const SourcesParts: React.FC<Props> = ({ parts }) => {
  if (parts.length === 0) {
    return null;
  }

  return (
    <Sources>
      <SourcesTrigger count={parts.length} />
      {parts.map((part, i) => (
        <SourcesContent key={`${part.sourceId}-${i}`}>
          <Source href={part.url} title={part.url} />
        </SourcesContent>
      ))}
    </Sources>
  );
};
