import { expect, it, vi } from "vitest";

import { observeQuery, queryObservation } from "./query-observation";

it("isolates observers between concurrent scopes and counts failures", async () => {
  const first =
    vi.fn<NonNullable<ReturnType<typeof queryObservation.getStore>>>();
  const second =
    vi.fn<NonNullable<ReturnType<typeof queryObservation.getStore>>>();
  await Promise.all([
    queryObservation.run(first, () =>
      observeQuery("primary", async () => {
        await Promise.resolve();
        return 42;
      })
    ),
    queryObservation.run(second, () =>
      expect(
        observeQuery("replica", () => Promise.reject(new Error("failure")))
      ).rejects.toThrow("failure")
    ),
  ]);
  expect(first).toHaveBeenCalledTimes(2);
  expect(first.mock.calls[0]?.[0]).toMatchObject({
    phase: "start",
    target: "primary",
  });
  expect(first.mock.calls[1]?.[0]).toMatchObject({
    phase: "end",
    target: "primary",
    ok: true,
  });
  expect(second).toHaveBeenCalledTimes(2);
  expect(second.mock.calls[1]?.[0]).toMatchObject({
    phase: "end",
    target: "replica",
    ok: false,
  });
  expect(await observeQuery("primary", () => Promise.resolve(7))).toBe(7);
  expect(first).toHaveBeenCalledTimes(2);
});
