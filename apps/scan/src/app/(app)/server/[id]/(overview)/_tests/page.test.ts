import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOrigin, overall, bucketed } = vi.hoisted(() => ({
  getOrigin: vi.fn<() => Promise<unknown>>(),
  overall: vi.fn<() => Promise<undefined>>(),
  bucketed: vi.fn<() => Promise<undefined>>(),
}));

vi.mock("../../_lib/get-origin", () => ({ getServerOrigin: getOrigin }));
vi.mock("@/trpc/server", () => ({
  api: {
    public: {
      stats: {
        overallByOrigin: { prefetch: overall },
        bucketedByOrigin: { prefetch: bucketed },
      },
    },
  },
  HydrateClient: vi.fn<() => null>(),
}));
vi.mock("../_components/overview", () => ({
  ServerOverview: vi.fn<() => null>(),
}));
vi.mock("../_components/resources", () => ({
  OriginResources: vi.fn<() => null>(),
  LoadingOriginResources: vi.fn<() => null>(),
}));
vi.mock("../_components/stat-cards", () => ({
  ServerStatCards: vi.fn<() => null>(),
  LoadingServerStatCards: vi.fn<() => null>(),
}));
vi.mock("../_components/usage-error-boundary", () => ({
  UsageErrorBoundary: vi.fn<() => null>(),
}));

import OriginPage from "../page";

const id = "b8a06bde-b6e8-4a10-b4e0-cc6a25fb9efb";
const props = () => ({
  params: Promise.resolve({ id }),
  searchParams: Promise.resolve({}),
});

describe("server overview loading", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the overview while both analytics requests are still pending", async () => {
    getOrigin.mockResolvedValue({ id, origin: "https://example.com" });
    overall.mockReturnValue(Promise.withResolvers<undefined>().promise);
    bucketed.mockReturnValue(Promise.withResolvers<undefined>().promise);

    const page = await OriginPage(props());

    expect(page).toBeDefined();
    expect(overall).toHaveBeenCalledWith({ originId: id, timeframe: 30 });
    expect(bucketed).toHaveBeenCalledWith({
      originId: id,
      timeframe: 30,
      numBuckets: 48,
    });
  });

  it("returns not found without starting analytics for an unknown origin", async () => {
    getOrigin.mockResolvedValue(null);

    await expect(OriginPage(props())).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404"
    );
    expect(overall).not.toHaveBeenCalled();
    expect(bucketed).not.toHaveBeenCalled();
  });
});
