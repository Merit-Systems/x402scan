import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOrigin, addresses, overall, bucketed } = vi.hoisted(() => ({
  getOrigin: vi.fn<() => Promise<unknown>>(),
  addresses: vi.fn<() => Promise<string[]>>(),
  overall: vi.fn<() => Promise<undefined>>(),
  bucketed: vi.fn<() => Promise<undefined>>(),
}));

vi.mock("../../_lib/get-origin", () => ({ getServerOrigin: getOrigin }));
vi.mock("@/services/db/resources/origin", () => ({
  getOriginPayToAddresses: addresses,
}));
vi.mock("@/services/transfers/stats/overall-mv", async () => {
  const { baseQuerySchema } = await import("@/services/transfers/schemas");
  return {
    getOverallStatisticsMV: overall,
    overallStatisticsMVInputSchema: baseQuerySchema,
  };
});
vi.mock("@/services/transfers/stats/bucketed-mv", async () => {
  const { baseBucketedQuerySchema } =
    await import("@/services/transfers/schemas");
  return {
    getBucketedStatisticsMV: bucketed,
    bucketedStatisticsMVInputSchema: baseBucketedQuerySchema,
  };
});
vi.mock("../_components/overview", () => ({
  LoadingServerOverview: vi.fn<() => null>(),
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

import { Statistics } from "../_components/sections";
import OriginPage from "../page";

const id = "b8a06bde-b6e8-4a10-b4e0-cc6a25fb9efb";
const props = () => ({
  params: Promise.resolve({ id }),
  searchParams: Promise.resolve({}),
});

describe("server overview loading", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    addresses.mockResolvedValue(["0x0000000000000000000000000000000000000001"]);
  });

  it("returns the shell immediately and starts both analytics reads concurrently", async () => {
    getOrigin.mockResolvedValue({ id, origin: "https://example.com" });
    const pendingOverall = Promise.withResolvers<undefined>();
    const pendingBucketed = Promise.withResolvers<undefined>();
    overall.mockReturnValue(pendingOverall.promise);
    bucketed.mockReturnValue(pendingBucketed.promise);

    const page = OriginPage(props());
    expect(page).toBeDefined();
    expect(overall).not.toHaveBeenCalled();
    const statistics = Statistics(props());
    await vi.waitFor(() => {
      expect(overall).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: {
            include: ["0x0000000000000000000000000000000000000001"],
          },
          timeframe: 30,
        })
      );
      expect(bucketed).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: {
            include: ["0x0000000000000000000000000000000000000001"],
          },
          timeframe: 30,
          numBuckets: 48,
        })
      );
    });
    pendingOverall.resolve(undefined);
    pendingBucketed.resolve(undefined);
    await expect(statistics).resolves.toBeDefined();
  });

  it("returns not found without starting analytics for an unknown origin", async () => {
    getOrigin.mockResolvedValue(null);

    await expect(Statistics(props())).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404"
    );
    expect(overall).not.toHaveBeenCalled();
    expect(bucketed).not.toHaveBeenCalled();
  });
});
