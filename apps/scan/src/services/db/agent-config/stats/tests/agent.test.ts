import { describe, expect, it, vi } from "vitest";

vi.mock("@x402scan/scan-db", () => ({ scanDb: {}, Prisma: {} }));
vi.mock("@/services/db/query", () => ({
  queryRaw: vi.fn<typeof import("@/services/db/query").queryRaw>(),
}));

import { agentConfigBucketedActivityInputSchema } from "../agent";

describe("agent activity cache inputs", () => {
  it("keeps an omitted end date stable across requests", () => {
    const input = { agentConfigurationId: "agent-one" };
    const parsed = agentConfigBucketedActivityInputSchema.parse(input);
    expect(parsed.endDate).toBeUndefined();
    expect(parsed).toEqual(agentConfigBucketedActivityInputSchema.parse(input));
    expect(parsed.numBuckets).toBe(48);
  });

  it("preserves an explicitly requested date range", () => {
    const input = {
      agentConfigurationId: "agent-one",
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-02-01T00:00:00Z"),
      numBuckets: 24,
    };
    expect(agentConfigBucketedActivityInputSchema.parse(input)).toEqual(input);
  });
});
