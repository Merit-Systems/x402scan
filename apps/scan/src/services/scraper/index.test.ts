import { describe, expect, it } from "vitest";

import { hasOgData } from "./index";

describe("hasOgData", () => {
  it("keeps later metadata when an earlier field is an empty string", () => {
    expect(
      hasOgData({
        ogTitle: "",
        ogDescription: "A useful description",
      })
    ).toBe(true);
  });
});
