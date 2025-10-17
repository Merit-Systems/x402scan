import superjson from 'superjson';
import { ZodError } from 'zod';

import { initTRPC, TRPCError } from '@trpc/server';

import { auth } from '@/auth';

import { infiniteQuerySchema } from '@/lib/pagination';

import type z from 'zod';
import type { Session } from 'next-auth';
import { env } from '@/env';

/**
 * Context that is passed to all TRPC procedures
 */
interface Context {
  headers: Headers;
  session: Session | null;
}

/**
 * Create context for each request
 */
export async function createTRPCContext(headers: Headers): Promise<Context> {
  const session = await auth();

  return {
    headers,
    session,
  };
}

/**
 * Initialize TRPC with our context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
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
    console.log(`[TRPC] ${path} took ${end - start}ms to execute`);
  }

  return result;
});

// ----------------------------
// Procedures
// ----------------------------

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user || ctx.session.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const infiniteQueryProcedure = <T>(cursorType: z.ZodType<T>) =>
  t.procedure
    .input(infiniteQuerySchema(cursorType))
    .use(async ({ ctx, next, input }) => {
      return next({
        ctx: {
          ...ctx,
          pagination: input,
        },
      });
    });
