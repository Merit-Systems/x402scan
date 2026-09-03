import { createServiceColumns } from "@/app/(app)/_components/service-collection";

import type { RouterOutputs } from "@/trpc/client";

export type FacilitatorServer =
  RouterOutputs["public"]["sellers"]["bazaar"]["summaries"]["items"][number];

export const facilitatorServerColumns = createServiceColumns<FacilitatorServer>(
  { enableMetricSorting: false }
);
