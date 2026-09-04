import posthog from "posthog-js";
import { env } from "./src/env";

const posthogKey = env.NEXT_PUBLIC_POSTHOG_KEY;
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2025-05-24",
    capture_exceptions: true,
    debug: env.NEXT_PUBLIC_NODE_ENV === "development",
  });
}
