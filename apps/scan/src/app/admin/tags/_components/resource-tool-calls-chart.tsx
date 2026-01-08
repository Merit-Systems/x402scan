'use client';

import { ResourceToolCallsByTagChart } from './resource-tool-calls-by-tag-chart';
import { ResourceToolCallsByResourceChart } from './resource-tool-calls-by-resource-chart';

interface ResourceToolCallsChartProps {
  selectedTagIds: string[];
}

export const ResourceToolCallsChart = ({
  selectedTagIds,
}: ResourceToolCallsChartProps) => {
  // Show breakdown by resource when tags are selected
  // Show breakdown by tag when no tags are selected
  if (selectedTagIds.length > 0) {
    return <ResourceToolCallsByResourceChart selectedTagIds={selectedTagIds} />;
  }

  return <ResourceToolCallsByTagChart />;
};
