import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { env } from "@/env";
import { appRouter } from "@/trpc/routers";
import { createTRPCContext } from "@/trpc/trpc";

import type { NextRequest } from "next/server";

/**
 * TRPC request handler for all HTTP methods
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    allowMethodOverride: true,
    onError: ({ path, error }) => {
      // Also log to console in development for immediate feedback
      if (env.NEXT_PUBLIC_NODE_ENV === "development") {
        console.error(
          `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
        );
      }
    },
  });

export { handler as GET, handler as POST };
