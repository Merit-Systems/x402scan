import { z } from "zod";

import { listPartners, searchPartners } from "@/services/db/partners";

import { createTRPCRouter, adminProcedure } from "../../trpc";

export const adminPartnersRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    return listPartners();
  }),

  search: adminProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      return searchPartners(input.searchTerm);
    }),
});
