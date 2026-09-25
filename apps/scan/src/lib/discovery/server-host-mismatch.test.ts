import { afterEach, describe, expect, it, vi } from "vitest";

import { detectServerHostMismatch } from "./server-host-mismatch";

/** The slice of an OpenAPI document these cases exercise. */
interface SpecFixture {
  servers?: { url: string }[];
  paths?: Record<string, never>;
}

function mockSpec(body: SpecFixture, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectServerHostMismatch", () => {
  it("reports the declared host when it differs from the document host", async () => {
    mockSpec({ servers: [{ url: "https://api.example.com" }] });

    await expect(
      detectServerHostMismatch("https://example.com")
    ).resolves.toEqual({
      documentOrigin: "https://example.com",
      declaredOrigin: "https://api.example.com",
    });
  });

  it("ignores a base path on the declared server", async () => {
    mockSpec({ servers: [{ url: "https://api.example.com/v1" }] });

    await expect(
      detectServerHostMismatch("https://example.com")
    ).resolves.toEqual({
      documentOrigin: "https://example.com",
      declaredOrigin: "https://api.example.com",
    });
  });

  it("returns null when the declared host matches", async () => {
    mockSpec({ servers: [{ url: "https://example.com/v1" }] });

    await expect(
      detectServerHostMismatch("https://example.com")
    ).resolves.toBeNull();
  });

  it("returns null for a relative server url", async () => {
    mockSpec({ servers: [{ url: "/v1" }] });

    await expect(
      detectServerHostMismatch("https://example.com")
    ).resolves.toBeNull();
  });

  it("returns null when the spec declares no servers", async () => {
    mockSpec({ paths: {} });

    await expect(
      detectServerHostMismatch("https://example.com")
    ).resolves.toBeNull();
  });

  it("returns null when the spec is unreachable", async () => {
    mockSpec({}, false);

    await expect(
      detectServerHostMismatch("https://example.com")
    ).resolves.toBeNull();
  });

  it("returns null when the fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));

    await expect(
      detectServerHostMismatch("https://example.com")
    ).resolves.toBeNull();
  });
});
