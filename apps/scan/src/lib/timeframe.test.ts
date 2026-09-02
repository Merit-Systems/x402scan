import { describe, expect, it } from "vitest";

import { ActivityTimeframe } from "@/types/timeframes";

import { DEFAULT_USAGE_TIMEFRAME, parseUsageTimeframe } from "./timeframe";

describe("parseUsageTimeframe", () => {
  it.each([
    ["0", ActivityTimeframe.AllTime],
    ["1", ActivityTimeframe.OneDay],
    ["7", ActivityTimeframe.SevenDays],
    ["14", ActivityTimeframe.FourteenDays],
    ["30", ActivityTimeframe.ThirtyDays],
  ])("parses %s", (raw, expected) => {
    expect(parseUsageTimeframe(raw)).toBe(expected);
  });

  it.each([undefined, "", "2", "thirty", ["7"]])(
    "uses the default for %j",
    (raw) => {
      expect(parseUsageTimeframe(raw)).toBe(DEFAULT_USAGE_TIMEFRAME);
    }
  );
});
