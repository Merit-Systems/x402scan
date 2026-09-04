import { env } from "@/env";
import type { Config } from "@coinbase/cdp-hooks";

export const cdpConfig: Config = {
  projectId: env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "",
  // The CDP SDK awaits an analytics beacon to cca-lite.coinbase.com inside its
  // wallet methods; ad blockers reject that fetch and the error propagates up
  // through wagmi's reconnect, breaking wallet restoration on page load.
  disableAnalytics: true,
  ethereum: {
    createOnLogin: "eoa",
  },
  solana: {
    createOnLogin: true,
  },
};
