import { describe, expect, it } from "vitest";

import { parseTableSorting } from "./table-state";

const sortIds = ["volume", "buyers"] as const;
const defaultSorting = { id: "volume", desc: true } as const;

describe("parseTableSorting", () => {
  it("returns the default sorting when the query is missing or invalid", () => {
    expect(parseTableSorting({}, sortIds, defaultSorting)).toEqual(
      defaultSorting
    );
    expect(
      parseTableSorting({ s: "unsupported" }, sortIds, defaultSorting)
    ).toEqual(defaultSorting);
    expect(
      parseTableSorting({ s: ["volume", "buyers"] }, sortIds, defaultSorting)
    ).toEqual(defaultSorting);
  });

  it("defaults valid sorts to descending and supports ascending order", () => {
    expect(parseTableSorting({ s: "buyers" }, sortIds, defaultSorting)).toEqual(
      {
        id: "buyers",
        desc: true,
      }
    );
    expect(
      parseTableSorting({ s: "buyers", sd: "asc" }, sortIds, defaultSorting)
    ).toEqual({ id: "buyers", desc: false });
  });

  it("supports route-specific query parameter names", () => {
    expect(
      parseTableSorting(
        { sort: "buyers", direction: "asc" },
        sortIds,
        defaultSorting,
        { sort: "sort", direction: "direction" }
      )
    ).toEqual({ id: "buyers", desc: false });
  });
});
