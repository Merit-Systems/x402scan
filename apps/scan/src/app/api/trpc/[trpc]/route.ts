import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/routers";
import { createTRPCContext } from "@/trpc/trpc";
import { env } from "@/env";

import type { NextRequest } from "next/server";

const createContext = async (req: NextRequest) => {
  return createTRPCContext(req.headers);
};

/**
 * TRPC request handler for all HTTP methods
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
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
