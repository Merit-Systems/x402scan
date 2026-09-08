import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import z from "zod";

import { auth } from "@/auth";
import { env } from "@/env";
import { paginatedQuerySchema } from "@/lib/pagination";

import type { Session } from "next-auth";

/** A context resolves authentication only when a protected procedure needs it. */
export function createTRPCContext() {
  let session: Promise<Session | null> | undefined;
  return { getSession: () => (session ??= auth()) };
}

/**
 * Initialize TRPC with our context and transformer
 */
const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create({
  transformer: superjson,
});

// ----------------------------
// Export reusable router and procedure helpers
// ----------------------------

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// ----------------------------
// Middleware
// ----------------------------

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  const result = await next();

  const end = Date.now();
  if (!env.HIDE_TRPC_LOGS) {
    console.log(`[TRPC] ${path} took ${String(end - start)}ms to execute`);
  }

  return result;
});

// ----------------------------
// Procedures
// ----------------------------

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await ctx.getSession();
  if (!session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session } });
});

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await ctx.getSession();
  if (!session?.user || session.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, session } });
});

export const paginatedProcedure = t.procedure
  .input(
    z
      .object({ pagination: paginatedQuerySchema })
      .default({ pagination: { page: 0, page_size: 100 } })
  )
  .use(async ({ ctx, next, input: { pagination } }) => {
    return next({
      ctx: {
        ...ctx,
        pagination,
      },
    });
  });
