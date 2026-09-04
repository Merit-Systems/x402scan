import { env } from "./src/env";

declare global {
  // Set once OTLP log export is wired up, so hot reloads don't re-initialize.
  var x402scanOtelLogsInitialized: boolean | undefined;
}

export async function register() {
  // prevent this from running in the edge runtime
  if (env.NEXT_RUNTIME === "nodejs") {
    // ---- SigNoz (OTLP Logs) ----
    // We only export logs when explicitly configured via env.
    // This keeps instrumentation safe for local/dev without secrets.
    const signozLogsUrl = "https://ingest.us.signoz.cloud:443/v1/logs";

    const signozIngestionKey = env.SIGNOZ_INGESTION_KEY?.trim();

    if (signozIngestionKey) {
      if (!globalThis.x402scanOtelLogsInitialized) {
        const { LoggerProvider, BatchLogRecordProcessor } =
          await import("@opentelemetry/sdk-logs");
        const { OTLPLogExporter } =
          await import("@opentelemetry/exporter-logs-otlp-http");
        const { logs } = await import("@opentelemetry/api-logs");
        const { resourceFromAttributes } =
          await import("@opentelemetry/resources");
        const { ATTR_SERVICE_NAME } =
          await import("@opentelemetry/semantic-conventions");

        const serviceName = getServiceName();

        const loggerProvider = new LoggerProvider({
          resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: serviceName,
          }),
          processors: [
            new BatchLogRecordProcessor(
              new OTLPLogExporter({
                url: signozLogsUrl,
                headers: {
                  "signoz-ingestion-key": signozIngestionKey,
                },
              })
            ),
          ],
        });

        logs.setGlobalLoggerProvider(loggerProvider);
        globalThis.x402scanOtelLogsInitialized = true;
      }
    }

    if (env.LMNR_PROJECT_API_KEY) {
      const { Laminar } = await import("@lmnr-ai/lmnr");

      Laminar.initialize({
        projectApiKey: env.LMNR_PROJECT_API_KEY,
      });
    }
  }
}

function getServiceName(): string {
  let serviceName = env.OTEL_SERVICE_NAME ?? "x402scan-scan-api";

  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    serviceName = `${serviceName}-prod`;
  } else if (env.VERCEL_ENV === "preview") {
    serviceName = `${serviceName}-preview`;
  } else {
    serviceName = `${serviceName}-dev`;
  }

  return serviceName;
}
