import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cachedQuery,
  invalidateQueryCacheTag,
  readQueryCache,
  refreshQueryCache,
} from "./query";

const fixture = vi.hoisted(() => {
  const entries = new Map<string, { value: string; expires: number }>();
  const get = vi.fn<(key: string) => Promise<string | null>>(async (key) => {
    const entry = entries.get(key);
    return entry && entry.expires > Date.now() ? entry.value : null;
  });
  const set = vi.fn<
    (
      key: string,
      value: string,
      ...options: (string | number)[]
    ) => Promise<string | null>
  >(async (key: string, value: string, ...options: (string | number)[]) => {
    const current = entries.get(key);
    if (options.includes("NX") && current && current.expires > Date.now())
      return null;
    const px = options.indexOf("PX");
    entries.set(key, {
      value,
      expires: px < 0 ? Infinity : Date.now() + Number(options[px + 1]),
    });
    return "OK";
  });
  const evalScript = vi.fn<
    (
      script: string,
      count: number,
      ...args: (string | number)[]
    ) => Promise<number>
  >(async (script: string, count: number, ...args: (string | number)[]) => {
    const key = String(args[0]);
    const token = String(args[count]);
    if ((await get(key)) !== token) return 0;
    if (script.includes("PEXPIRE")) {
      entries.set(key, {
        value: token,
        expires: Date.now() + Number(args[count + 1]),
      });
    } else {
      if (count === 2)
        entries.set(String(args[1]), {
          value: String(args[3]),
          expires: Date.now() + Number(args[4]) * 1000,
        });
      entries.delete(key);
    }
    return 1;
  });
  return { entries, redis: { get, set, eval: evalScript }, enabled: true };
});
vi.mock("../redis", () => ({
  getRedisClient: () => (fixture.enabled ? fixture.redis : null),
}));
vi.mock("next/server", () => ({
  connection: async () => {
    /* No Next request context in the cache tests. */
  },
}));
vi.mock("@/env", () => ({
  env: {
    NODE_ENV: "test",
    SCAN_DATABASE_URL: "test-scan",
    TRANSFERS_DB_URL: "test-transfers",
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  fixture.entries.clear();
  fixture.enabled = true;
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("query cache", () => {
  it("coalesces 20 slow misses past the old 10s fallback and renews the 30s lease", async () => {
    const origin = vi.fn<() => Promise<{ date: Date; amount: bigint }>>(
      async () => {
        await delay(40_000);
        return { date: new Date(0), amount: 12n };
      }
    );
    const requests = Promise.all(
      Array.from({ length: 20 }, () => readQueryCache("slow", [], origin))
    );
    await vi.advanceTimersByTimeAsync(40_100);
    const values = await requests;
    expect(origin).toHaveBeenCalledTimes(1);
    expect(values).toEqual(
      Array.from({ length: 20 }, () => ({ date: new Date(0), amount: 12n }))
    );
    expect(await readQueryCache("slow", [], origin)).toEqual(values[0]);
    expect(origin).toHaveBeenCalledTimes(1);
  });

  it("waits for a fresh publication when warming and lets normal readers use the old value", async () => {
    let result = 1;
    const origin = vi.fn<() => Promise<number>>(async () => {
      await delay(100);
      return result;
    });
    const query = cachedQuery("warm", origin);
    const first = query();
    await vi.advanceTimersByTimeAsync(100);
    expect(await first).toBe(1);
    result = 2;
    const warms = refreshQueryCache(() => Promise.all([query(), query()]));
    await vi.advanceTimersByTimeAsync(50);
    expect(await query()).toBe(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(await warms).toEqual([2, 2]);
    expect(await query()).toBe(2);
    expect(origin).toHaveBeenCalledTimes(2);
  });

  it("expires results and separates query inputs", async () => {
    const origin = vi.fn<() => Promise<number>>(async () => 1);
    await readQueryCache("ttl", [1], origin, { ttlSeconds: 1 });
    await readQueryCache("ttl", [2], origin, { ttlSeconds: 1 });
    expect(origin).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1001);
    await readQueryCache("ttl", [1], origin, { ttlSeconds: 1 });
    expect(origin).toHaveBeenCalledTimes(3);
  });

  it("invalidates tagged results even while an older query is in flight", async () => {
    const old = readQueryCache(
      "resources",
      [],
      async () => {
        await delay(100);
        return "old";
      },
      { tags: ["resources"] }
    );
    await vi.advanceTimersByTimeAsync(50);
    await invalidateQueryCacheTag("resources");
    expect(
      await readQueryCache("resources", [], async () => "new", {
        tags: ["resources"],
      })
    ).toBe("new");
    await vi.advanceTimersByTimeAsync(100);
    await old;
    expect(
      await readQueryCache("resources", [], async () => "unexpected", {
        tags: ["resources"],
      })
    ).toBe("new");
  });

  it("times out contention without launching another origin read", async () => {
    const owner = readQueryCache("timeout", [], async () => {
      await delay(60_000);
      return 1;
    });
    await vi.advanceTimersByTimeAsync(1);
    const origin = vi.fn<() => Promise<number>>(async () => 2);
    const waiter = (async () => {
      await expect(readQueryCache("timeout", [], origin)).rejects.toThrow(
        "Timed out waiting"
      );
    })();
    await vi.advanceTimersByTimeAsync(55_100);
    await waiter;
    expect(origin).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    await owner;
  });

  it("never publishes or deletes a successor lock after losing ownership", async () => {
    const owner = readQueryCache("lost", [], async () => {
      await delay(100);
      return "old";
    });
    await vi.advanceTimersByTimeAsync(50);
    const lock = [...fixture.entries.keys()].find((key) =>
      key.endsWith(":lock")
    );
    if (!lock) throw new Error("Expected owner lock");
    fixture.entries.set(lock, { value: "successor", expires: Infinity });
    await vi.advanceTimersByTimeAsync(100);
    expect(await owner).toBe("old");
    expect(await fixture.redis.get(lock)).toBe("successor");
    expect(await fixture.redis.get(lock.slice(0, -5))).toBeNull();
  });

  it("does not cache errors and releases their lease for a retry", async () => {
    await expect(
      readQueryCache("error", [], async () => {
        throw new Error("origin");
      })
    ).rejects.toThrow("origin");
    expect(await readQueryCache("error", [], async () => 2)).toBe(2);
  });

  it("falls back when Redis is disabled or the initial read fails", async () => {
    const origin = vi.fn<() => Promise<number>>(async () => 3);
    fixture.enabled = false;
    expect(await readQueryCache("offline", [], origin)).toBe(3);
    fixture.enabled = true;
    vi.spyOn(console, "warn").mockImplementation(() => {
      /* Expected outage logging. */
    });
    fixture.redis.get.mockRejectedValueOnce(new Error("offline"));
    expect(await readQueryCache("offline", [], origin)).toBe(3);
  });

  it("returns successful origin data if publication fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      /* Expected outage logging. */
    });
    fixture.redis.eval.mockRejectedValueOnce(new Error("write failed"));
    expect(await readQueryCache("write-error", [], async () => 4)).toBe(4);
  });
});
