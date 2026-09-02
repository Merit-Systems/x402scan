import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { listPartners, searchPartners } from "@/services/db/partners";

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
