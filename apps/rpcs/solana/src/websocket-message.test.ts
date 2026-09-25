import { describe, expect, it } from "vitest";

import { webSocketMessageDataSchema } from "./websocket-message";

describe("webSocketMessageDataSchema", () => {
  it("preserves text frames", () => {
    const frame = '{"jsonrpc":"2.0"}';
    expect(webSocketMessageDataSchema.parse(frame)).toBe(frame);
  });

  it("preserves binary frames", () => {
    const frame = new Uint8Array([1, 2, 3]).buffer;
    expect(webSocketMessageDataSchema.parse(frame)).toBe(frame);
  });

  it("rejects unsupported frame types", () => {
    expect(webSocketMessageDataSchema.safeParse(new Blob()).success).toBe(
      false
    );
  });
});
