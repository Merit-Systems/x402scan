"use client";

import {
  MotionToggleGroup,
  MotionToggleItem,
} from "@/components/ui/motion-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReplaceSearchParams } from "@/hooks/use-replace-search-params";
import { DEFAULT_SERVICE_VIEW, type ServiceView } from "@/lib/discover/filters";

const OPTIONS: { label: string; value: ServiceView }[] = [
  { label: "Featured", value: "featured" },
  { label: "All", value: "all" },
];

export function ServiceViewToggle({ view }: { view: ServiceView }) {
  const replaceSearchParams = useReplaceSearchParams();

  const setView = (nextView: ServiceView) => {
    if (nextView === view) return;

    replaceSearchParams((params) => {
      if (nextView === DEFAULT_SERVICE_VIEW) {
        params.delete("v");
      } else {
        params.set("v", nextView);
      }

      params.delete("p");
    });
  };

  return (
    <>
      <Select
        value={view}
        onValueChange={(value) => {
          if (value === "featured" || value === "all") setView(value);
        }}
      >
        <SelectTrigger
          aria-label="Service view"
          variant="ghost"
          size="sm"
          className="sm:hidden"
        >
          <SelectValue>
            {(value: ServiceView | null) =>
              OPTIONS.find((option) => option.value === value)?.label ?? "View"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <MotionToggleGroup
        aria-label="Service view"
        value={view}
        onValueChange={(value) => {
          if (value === "featured" || value === "all") setView(value);
        }}
        className="hidden sm:inline-flex"
      >
        {OPTIONS.map((option) => (
          <MotionToggleItem key={option.value} value={option.value}>
            {option.label}
          </MotionToggleItem>
        ))}
      </MotionToggleGroup>
    </>
  );
}
