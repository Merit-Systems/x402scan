import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Session } from "next-auth";

const { auth } = vi.hoisted(() => ({
  auth: vi.fn<() => Promise<Session | null>>(),
}));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/env", () => ({ env: { HIDE_TRPC_LOGS: true } }));

import {
  adminProcedure,
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

const router = createTRPCRouter({
  publicRead: publicProcedure.query(() => "public"),
  protectedRead: protectedProcedure.query(({ ctx }) => ctx.session.user.id),
  adminRead: adminProcedure.query(({ ctx }) => ctx.session.user.id),
});
const session = (role: Session["user"]["role"]): Session => ({
  expires: "2099-01-01T00:00:00.000Z",
  user: { id: "user-1", role, accounts: [] },
});

describe("request authentication", () => {
  beforeEach(() => {
    auth.mockReset();
  });

  it("does not authenticate public procedures", async () => {
    const caller = router.createCaller(createTRPCContext());
    expect(await caller.publicRead()).toBe("public");
    expect(auth).not.toHaveBeenCalled();
  });

  it("shares one pending session lookup within a request", async () => {
    const pending = Promise.withResolvers<Session | null>();
    auth.mockReturnValue(pending.promise);
    const context = createTRPCContext();
    const first = context.getSession();
    expect(context.getSession()).toBe(first);
    pending.resolve(session("admin"));
    const caller = router.createCaller(context);
    expect(await caller.protectedRead()).toBe("user-1");
    expect(await caller.adminRead()).toBe("user-1");
    expect(auth).toHaveBeenCalledTimes(1);
  });

  it("does not share sessions between request contexts", async () => {
    auth.mockResolvedValue(null);
    await createTRPCContext().getSession();
    await createTRPCContext().getSession();
    expect(auth).toHaveBeenCalledTimes(2);
  });

  it("rejects anonymous protected and admin calls", async () => {
    auth.mockResolvedValue(null);
    const caller = router.createCaller(createTRPCContext());
    await expect(caller.protectedRead()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.adminRead()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects non-admin users from admin procedures", async () => {
    auth.mockResolvedValue(session("user"));
    const caller = router.createCaller(createTRPCContext());
    expect(await caller.protectedRead()).toBe("user-1");
    await expect(caller.adminRead()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
