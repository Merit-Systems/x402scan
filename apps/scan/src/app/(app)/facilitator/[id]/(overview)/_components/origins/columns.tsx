import { createServiceColumnSet } from "@/app/(app)/_components/service-collection";

import type { RouterOutputs } from "@/trpc/client";

export type FacilitatorServer =
  RouterOutputs["public"]["sellers"]["bazaar"]["summaries"]["items"][number];

const columns = createServiceColumnSet<FacilitatorServer>({
  enableMetricSorting: false,
});

export const facilitatorServerColumns = [
  columns.server,
  columns.volume,
  columns.transactions,
  columns.buyers,
  columns.chain,
];
