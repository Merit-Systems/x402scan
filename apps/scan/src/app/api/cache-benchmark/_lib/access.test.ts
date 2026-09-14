import { describe, expect, it } from "vitest";

import { benchmarkAccess } from "./access";
import { benchmarkInput } from "./input";

const token = "a".repeat(32);

describe("benchmark access", () => {
  it("is inaccessible outside preview even with a valid token", () => {
    for (const environment of [undefined, "production", "development"]) {
      expect(benchmarkAccess(environment, token, `Bearer ${token}`)).toBe(
        false
      );
    }
  });
  it("fails closed for missing, short or incorrect credentials", () => {
    expect(benchmarkAccess("preview", undefined, null)).toBe(false);
    expect(benchmarkAccess("preview", "short", "Bearer short")).toBe(false);
    expect(benchmarkAccess("preview", token, null)).toBe(false);
    expect(benchmarkAccess("preview", token, "Bearer wrong")).toBe(false);
    expect(benchmarkAccess("preview", token, `Bearer ${token}`)).toBe(true);
  });
  it("accepts only isolated run IDs and fixed queries", () => {
    const input = {
      run: "a2f8bdca-f9b6-43fb-8747-f629f92d88af",
      query: "overall",
      mode: "next",
    };
    expect(benchmarkInput.safeParse(input).success).toBe(true);
    expect(
      benchmarkInput.safeParse({ ...input, run: "shared-application-key" })
        .success
    ).toBe(false);
    expect(
      benchmarkInput.safeParse({ ...input, query: "SELECT *" }).success
    ).toBe(false);
    expect(
      benchmarkInput.safeParse({ ...input, sql: "SELECT *" }).success
    ).toBe(false);
  });
});
