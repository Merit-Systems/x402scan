import Link from "next/link";

import type { RowData } from "@tanstack/react-table";
import type { Route } from "next";
import type { DataTableProps } from "@/components/ui/data-table";

export const renderTableRowLink: NonNullable<
  DataTableProps<RowData>["renderRowLink"]
> = (props) => (
  <Link
    {...props}
    // The table's framework-neutral href contract is a string; callers own route construction.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    href={props.href as Route}
  />
);
