'use client';

import { useState } from 'react';
import { TagFilter } from './tag-filter';
import { ResourceCreationsChart } from './resource-creations-chart';
import { ResourceToolCallsChart } from './resource-tool-calls-chart';
import { ResourceToolCallsSummary } from './resource-tool-calls-summary';

export const ResourceCharts = () => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resource Analytics</h2>
        <div className="flex items-center gap-2">
          <TagFilter
            selectedTagIds={selectedTagIds}
            onSelectedTagIdsChange={setSelectedTagIds}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ResourceCreationsChart selectedTagIds={selectedTagIds} />
        <ResourceToolCallsSummary selectedTagIds={selectedTagIds} />
      </div>

      <ResourceToolCallsChart selectedTagIds={selectedTagIds} />
    </div>
  );
};
