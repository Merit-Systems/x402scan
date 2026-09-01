import { describe, expect, it } from "vitest";

import { endpointDescription } from "./endpoint-description";

describe("endpointDescription", () => {
  it("returns the summary for real text", () => {
    expect(
      endpointDescription({
        method: "GET",
        path: "/v1/catalog",
        summary: "Lists purchasable records",
      })
    ).toBe("Lists purchasable records");
  });

  it('drops the "METHOD /path" placeholder', () => {
    expect(
      endpointDescription({
        method: "GET",
        path: "/v1/catalog",
        summary: "GET /v1/catalog",
      })
    ).toBeUndefined();
  });

  it("caps oversized descriptions", () => {
    const result = endpointDescription({
      method: "GET",
      path: "/v1/catalog",
      summary: "x".repeat(10_000),
    });
    expect(result).toHaveLength(500);
  });

  it("returns undefined when the summary is missing or empty", () => {
    expect(
      endpointDescription({ method: "GET", path: "/v1/catalog" })
    ).toBeUndefined();
    expect(
      endpointDescription({ method: "GET", path: "/v1/catalog", summary: "" })
    ).toBeUndefined();
  });
});
