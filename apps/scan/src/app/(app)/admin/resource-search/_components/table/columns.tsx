import type { DataTableColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/image-avatar";
import { Globe, Filter } from "lucide-react";
import type { FilteredSearchResult } from "@/services/resource-search/types";
import { cleanExternalText } from "@/lib/utils";
import { HeaderCell } from "@/app/(app)/admin/_components/data-table-header-cell";
import { ResourceSearchSortingContext } from "@/app/(app)/admin/_contexts/sorting/resource-search/context";

export const createColumns = (): DataTableColumnDef<FilteredSearchResult>[] => [
  {
    accessorKey: "filterMatches",
    header: () => (
      <HeaderCell
        Icon={Filter}
        label="Match"
        className="justify-start"
        sorting={{
          sortContext: ResourceSearchSortingContext,
          sortKey: "filterMatches",
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
            <span className="type-caption text-muted-foreground">N/A</span>
          </div>
        );
      }

      const matchPercentage = (filterMatches / totalFilters) * 100;
      const badgeColor =
        matchPercentage === 100
          ? "bg-green-500/10 text-green-500 border-green-500/20"
          : matchPercentage >= 60
            ? "bg-primary/10 text-primary border-primary/20"
            : matchPercentage >= 40
              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              : "bg-red-500/10 text-red-500 border-red-500/20";

      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-primary" />
            <Badge variant="outline" className={` ${badgeColor}`}>
              {filterMatches}/{totalFilters}
            </Badge>
          </div>
          <div className="type-caption text-muted-foreground">
            {matchPercentage.toFixed(0)}% match
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: () => (
      <HeaderCell
        Icon={Globe}
        label="Title"
        className="justify-start"
        sorting={{
          sortContext: ResourceSearchSortingContext,
          sortKey: "title",
        }}
      />
    ),
    size: 25,
    cell: ({ row }) => {
      const origin = row.original.origin;
      const favicon = origin.favicon;
      const title = origin.title
        ? cleanExternalText(origin.title)
        : origin.origin;

      return (
        <div className="flex items-center gap-3">
          <Avatar
            src={favicon ?? undefined}
            fallback={<Globe className="size-4 text-muted-foreground" />}
            className="size-10 shrink-0"
          />
          <span className="type-emphasis truncate type-label">{title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 55,
    cell: ({ row }) => {
      const accepts = row.original.accepts;
      const description = cleanExternalText(
        accepts.find((accept) => accept.description)?.description ??
          "No description available"
      );

      return (
        <div className="min-h-[100px] py-2">
          <span className="type-supporting-body whitespace-normal">
            {description}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "tags",
    header: "Tag",
    size: 10,
    cell: ({ row }) => {
      const tags = row.original.tags;

      if (tags.length === 0) {
        return (
          <span className="type-caption text-muted-foreground">No tags</span>
        );
      }

      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className=""
              style={{
                borderColor: tag.color,
                backgroundColor: tag.color + "10",
              }}
            >
              {tag.name}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      );
    },
  },
];
