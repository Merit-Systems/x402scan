import type { ExtendedColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Globe, TrendingUp, Zap, CheckCircle, Filter } from 'lucide-react';
import type { FilteredSearchResult } from '@/services/resource-search/types';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { ResourceSearchSortingContext } from '@/app/_contexts/sorting/resource-search/context';

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms.toFixed(0)}ms`;
}

function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export const createColumns = (): ExtendedColumnDef<FilteredSearchResult>[] => [
  {
    accessorKey: 'filterMatches',
    header: () => (
      <HeaderCell
        Icon={Filter}
        label="Match"
        className="justify-start"
        sorting={{
          sortContext: ResourceSearchSortingContext,
          sortKey: 'filterMatches',
        }}
      />
    ),
    size: 10,
    cell: ({ row }) => {
      const filterMatches = row.original.filterMatches;
      const filterAnswers = row.original.filterAnswers;
      const totalFilters = filterAnswers.length;

      if (totalFilters === 0) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">N/A</span>
          </div>
        );
      }

      const matchPercentage = (filterMatches / totalFilters) * 100;
      const badgeColor =
        matchPercentage === 100
          ? 'bg-green-500/10 text-green-500 border-green-500/20'
          : matchPercentage >= 60
            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            : matchPercentage >= 40
              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20';

      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${badgeColor}`}
            >
              {filterMatches}/{totalFilters}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {matchPercentage.toFixed(0)}% match
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: () => (
      <HeaderCell
        Icon={Globe}
        label="Title"
        className="justify-start"
        sorting={{
          sortContext: ResourceSearchSortingContext,
          sortKey: 'title',
        }}
      />
    ),
    size: 25,
    cell: ({ row }) => {
      const origin = row.original.origin;
      const favicon = origin.favicon;
      const title = origin.title ?? origin.origin;

      return (
        <div className="flex items-center gap-3">
          <Avatar
            src={favicon ?? undefined}
            fallback={<Globe className="h-4 w-4 text-muted-foreground" />}
            className="h-10 w-10 shrink-0"
          />
          <span className="font-medium truncate">{title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    size: 65,
    cell: ({ row }) => {
      const accepts = row.original.accepts;
      const description =
        accepts.find(accept => accept.description)?.description ??
        'No description available';

      return (
        <div className="min-h-[100px] py-2">
          <span className="text-sm whitespace-normal">{description}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'tags',
    header: 'Tag',
    size: 10,
    cell: ({ row }) => {
      const tags = row.original.tags;

      if (tags.length === 0) {
        return <span className="text-xs text-muted-foreground">No tags</span>;
      }

      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.slice(0, 3).map(tag => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs"
              style={{
                borderColor: tag.color,
                backgroundColor: tag.color + '10',
              }}
            >
              {tag.name}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'usage',
    header: () => (
      <HeaderCell
        Icon={TrendingUp}
        label="Usage"
        className="justify-start"
        sorting={{
          sortContext: ResourceSearchSortingContext,
          sortKey: 'usage',
        }}
      />
    ),
    size: 15,
    cell: ({ row }) => {
      const analytics = row.original.analytics;

      if (!analytics) {
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-sm font-medium">
            {formatNumber(analytics.totalCalls)} calls
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'performance',
    header: () => (
      <HeaderCell
        Icon={Zap}
        label="Performance"
        className="justify-start"
        sorting={{
          sortContext: ResourceSearchSortingContext,
          sortKey: 'performance',
        }}
      />
    ),
    size: 15,
    cell: ({ row }) => {
      const analytics = row.original.analytics;

      if (!analytics) {
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        );
      }

      const successRateColor =
        analytics.successRate >= 0.95
          ? 'text-green-500'
          : analytics.successRate >= 0.8
            ? 'text-yellow-500'
            : 'text-red-500';

      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-sm font-medium">
              {formatDuration(analytics.avgDuration)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className={`h-3 w-3 ${successRateColor}`} />
            <span className={successRateColor}>
              {formatPercentage(analytics.successRate)} success
            </span>
          </div>
        </div>
      );
    },
  },
];
