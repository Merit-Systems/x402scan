import { describe, expect, it, vi } from "vitest";

import { upsertResourceResponse } from "./response";

const { upsert } = vi.hoisted(() => ({
  upsert: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
}));

vi.mock("@x402scan/scan-db", () => ({
  scanDb: { resourceResponse: { upsert } },
}));

describe("upsertResourceResponse", () => {
  it("removes undefined optional fields before persisting parsed responses", async () => {
    await upsertResourceResponse("resource-1", {
      x402Version: 2,
      error: undefined,
      accepts: [],
      extensions: {
        bazaar: {
          info: { input: undefined },
          schema: undefined,
        },
      },
    });

    expect(upsert).toHaveBeenCalledWith({
      where: { resourceId: "resource-1" },
      update: {
        resourceId: "resource-1",
        response: {
          x402Version: 2,
          accepts: [],
          extensions: { bazaar: { info: {} } },
        },
      },
      create: {
        resourceId: "resource-1",
        response: {
          x402Version: 2,
          accepts: [],
          extensions: { bazaar: { info: {} } },
        },
      },
    });
  });
});
