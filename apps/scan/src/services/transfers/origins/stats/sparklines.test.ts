import { describe, expect, it } from "vitest";

import { buildOriginTransactionSparklines } from "./sparkline-values";

describe("buildOriginTransactionSparklines", () => {
  it("groups ordered transaction values by origin", () => {
    const firstBucket = new Date("2026-01-01T00:00:00.000Z");
    const secondBucket = new Date("2026-01-01T01:00:00.000Z");

    expect(
      buildOriginTransactionSparklines(
        [
          { originId: "one", recipients: ["a", "b"] },
          { originId: "two", recipients: ["c"] },
          { originId: "empty", recipients: ["d"] },
        ],
        [
          { recipient: "a", bucket: firstBucket, transactions: 2 },
          { recipient: "b", bucket: secondBucket, transactions: 5 },
          { recipient: "c", bucket: firstBucket, transactions: 3 },
        ]
      )
    ).toEqual({ one: [2, 5], two: [3, 0], empty: [0, 0] });
  });

  it("ignores rows outside the requested origin set", () => {
    expect(
      buildOriginTransactionSparklines(
        [{ originId: "one", recipients: ["a"] }],
        [
          {
            recipient: "other",
            bucket: new Date("2026-01-01T00:00:00.000Z"),
            transactions: 4,
          },
        ]
      )
    ).toEqual({ one: [] });
  });
});
