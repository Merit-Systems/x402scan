export async function register() {
  // prevent this from running in the edge runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // ---- SigNoz (OTLP Logs) ----
    // We only export logs when explicitly configured via env.
    // This keeps instrumentation safe for local/dev without secrets.
    const signozLogsUrl = 'https://ingest.us.signoz.cloud:443/v1/logs';

    const signozIngestionKey = process.env.SIGNOZ_INGESTION_KEY?.trim();

    if (signozIngestionKey) {
      const globalForOtel = globalThis as unknown as {
        __x402scanOtelLogsInitialized?: boolean;
      };

      if (!globalForOtel.__x402scanOtelLogsInitialized) {
        const { LoggerProvider, BatchLogRecordProcessor } =
          await import('@opentelemetry/sdk-logs');
        const { OTLPLogExporter } =
          await import('@opentelemetry/exporter-logs-otlp-http');
        const { logs } = await import('@opentelemetry/api-logs');
        const { resourceFromAttributes } =
          await import('@opentelemetry/resources');
        const { ATTR_SERVICE_NAME } =
          await import('@opentelemetry/semantic-conventions');

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
                  'signoz-ingestion-key': signozIngestionKey,
                },
              })
            ),
          ],
        });

        logs.setGlobalLoggerProvider(loggerProvider);
        globalForOtel.__x402scanOtelLogsInitialized = true;
      }
    }

    const { Laminar } = await import('@lmnr-ai/lmnr');

    Laminar.initialize({
      projectApiKey: process.env.LMNR_PROJECT_API_KEY,
    });
  }
}

function getServiceName(): string {
  let serviceName = process.env.OTEL_SERVICE_NAME ?? 'x402scan-scan-api';

  if (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  ) {
    serviceName = `${serviceName}-prod`;
  } else if (process.env.VERCEL_ENV === 'preview') {
    serviceName = `${serviceName}-preview`;
  } else {
    serviceName = `${serviceName}-dev`;
  }

  return serviceName;
}
