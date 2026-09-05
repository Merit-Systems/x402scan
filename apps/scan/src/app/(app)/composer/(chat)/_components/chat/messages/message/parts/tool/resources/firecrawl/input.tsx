import { Search } from "lucide-react";

import z from "zod";

import type { InputComponent } from "../types";

const schema = z.object({
  query: z.string(),
  limit: z.number().optional(),
});

export const FirecrawlInput: InputComponent = ({ input }) => {
  const parseResult = schema.safeParse(input);

  if (!parseResult.success) {
    return <div>Invalid input</div>;
  }

  const { query, limit } = parseResult.data;

  return (
    <div className="flex items-center gap-2">
      <Search className="size-4 shrink-0" />
      <p className="type-supporting-body type-emphasis">
        {query}{" "}
        {limit ? (
          <span className="type-caption text-muted-foreground">
            ({limit} Result{limit > 1 ? "s" : ""})
          </span>
        ) : (
          ""
        )}
      </p>
    </div>
  );
};
