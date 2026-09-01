import { describe, expect, it } from "vitest";

import { isOpenApiDeclaredFree, isRegistrableEndpoint } from "./catalog-auth";

describe("isOpenApiDeclaredFree", () => {
  it.each([
    ["unprotected", "openapi", true],
    ["apiKey", "openapi", true],
    ["unprotected", "well-known", false],
    ["apiKey", "well-known", false],
    ["unprotected", undefined, false],
    ["apiKey", undefined, false],
    ["paid", "openapi", false],
    ["siwx", "openapi", false],
    ["apiKey+paid", "openapi", false],
    [undefined, "openapi", false],
  ] as const)("(%s, %s) → %s", (authMode, source, expected) => {
    expect(isOpenApiDeclaredFree(authMode, source)).toBe(expected);
  });
});

describe("isRegistrableEndpoint", () => {
  it.each([
    // Unclassified — may be paid but undetected; probe it.
    [undefined, "openapi", true],
    [undefined, "well-known", true],
    // Always registrable regardless of source.
    ["paid", "well-known", true],
    ["apiKey+paid", "well-known", true],
    ["siwx", "well-known", true],
    // Catalog rows only from openapi.
    ["unprotected", "openapi", true],
    ["apiKey", "openapi", true],
    ["unprotected", "well-known", false],
    ["apiKey", "well-known", false],
    ["unprotected", undefined, false],
  ] as const)("(%s, %s) → %s", (authMode, source, expected) => {
    expect(isRegistrableEndpoint(authMode, source)).toBe(expected);
  });
});
