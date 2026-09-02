import { describe, expect, it } from "vitest";

import {
  DEFAULT_DISCOVER_TIMEFRAME,
  DEFAULT_SERVICE_VIEW,
  formatDiscoverPage,
  parseDiscoverPage,
  parseDiscoverTimeframe,
  parseServiceView,
} from "./filters";
import { ActivityTimeframe } from "@/types/timeframes";

describe("parseDiscoverTimeframe", () => {
  it.each([
    ["0", ActivityTimeframe.AllTime],
    ["1", ActivityTimeframe.OneDay],
    ["7", ActivityTimeframe.SevenDays],
    ["14", ActivityTimeframe.FifteenDays],
    ["30", ActivityTimeframe.ThirtyDays],
  ])("parses %s", (raw, expected) => {
    expect(parseDiscoverTimeframe(raw)).toBe(expected);
  });

  it.each([undefined, "", "2", "thirty", ["7"]])(
    "uses the default for %j",
    (raw) => {
      expect(parseDiscoverTimeframe(raw)).toBe(DEFAULT_DISCOVER_TIMEFRAME);
    }
  );
});

describe("parseServiceView", () => {
  it.each(["featured", "all"] as const)("parses %s", (view) => {
    expect(parseServiceView(view)).toBe(view);
  });

  it.each([undefined, "", "unknown", ["all"]])(
    "uses the default for %j",
    (raw) => {
      expect(parseServiceView(raw)).toBe(DEFAULT_SERVICE_VIEW);
    }
  );
});

describe("parseDiscoverPage", () => {
  it.each([
    [undefined, 0],
    ["", 0],
    ["0", 0],
    ["1", 0],
    ["2", 1],
    ["12", 11],
    ["1.5", 0],
    ["nope", 0],
    [["2"], 0],
  ])("parses %j as page %d", (raw, expected) => {
    expect(parseDiscoverPage(raw)).toBe(expected);
  });
});

describe("formatDiscoverPage", () => {
  it.each([
    [0, null],
    [-1, null],
    [1, "2"],
    [11, "12"],
  ])("formats page %d as %j", (page, expected) => {
    expect(formatDiscoverPage(page)).toBe(expected);
  });
});
