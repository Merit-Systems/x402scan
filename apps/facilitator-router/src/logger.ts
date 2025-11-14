import { context, metrics, trace } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import { AsyncLocalStorage } from 'async_hooks';
import winston from 'winston';
import { env } from './env';

// AsyncLocalStorage for storing requestId across async operations
export const requestIdStorage = new AsyncLocalStorage<string>();

const serviceName = env.OTEL_SERVICE_NAME + '-' + env.NODE_ENV.toLowerCase();

// Create resource with our custom service name
// Resource detection is disabled in NodeSDK config to ensure our custom service name takes precedence
const resource = resourceFromAttributes({
  'service.name': serviceName,
  'service.version': env.OTEL_SERVICE_VERSION,
  'deployment.environment': env.NODE_ENV,
});

// -------------------------
// 🔹 LOGS SETUP
// -------------------------

// Configure log exporter with Signoz headers
const logExporter = new OTLPLogExporter({
  url: env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
  headers: {
    'signoz-access-token': env.SIGNOZ_INGESTION_KEY,
  },
});

const loggerProvider = new LoggerProvider({
  resource: resource,
});

loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));

// Register the logger provider globally
logs.setGlobalLoggerProvider(loggerProvider);

// -------------------------
// 🔹 TRACING SETUP
// -------------------------

// Configure trace exporter with Signoz headers
const traceExporter = new OTLPTraceExporter({
  url: env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  headers: {
    'signoz-access-token': env.SIGNOZ_INGESTION_KEY,
  },
});

const sdk = new NodeSDK({
  resource: resource,
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter: traceExporter,
  resourceDetectors: [], // Disable automatic resource detection to use our custom service name
});

// Start the SDK
sdk.start();

// Shutdown handler
process.on('SIGTERM', () => {
  Promise.all([
    sdk.shutdown(),
    loggerProvider.shutdown(),
    meterProvider.shutdown(),
  ])
    .then(() => console.log('OpenTelemetry terminated'))
    .catch((error) => console.error('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});

// Custom Winston format to inject traceId/spanId/requestId
const traceContextFormat = winston.format(info => {
  const span = trace.getSpan(context.active());
  if (span) {
    const spanContext = span.spanContext();
    info.traceId = spanContext.traceId;
    info.spanId = spanContext.spanId;
  }

  // Inject requestId from AsyncLocalStorage
  const requestId = requestIdStorage.getStore();
  if (requestId) {
    info.requestId = requestId;
  }

  return info;
});

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    traceContextFormat(), // 👈 injects traceId/spanId/requestId into each log
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: serviceName,
    environment: env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console(),
    new OpenTelemetryTransportV3(),
  ],
});

// -------------------------
// 🔹 METRICS SETUP
// -------------------------

const metricExporter = new OTLPMetricExporter({
  url: env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
  headers: {
    'signoz-access-token': env.SIGNOZ_INGESTION_KEY,
  },
});

const meterProvider = new MeterProvider({
  resource: resource,
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 1000, // optional, defaults to 60s
    }),
  ],
});

// Register the meter provider globally
metrics.setGlobalMeterProvider(meterProvider);

const meter = meterProvider.getMeter(serviceName);

// Cache for counters
const counters: Record<string, ReturnType<typeof meter.createCounter>> = {};

// Custom metric function
export const logMetric = (
  metricName: string,
  value: number = 1,
  attributes?: Record<string, string | number | boolean>
) => {
  if (!counters[metricName]) {
    logger.info(`Creating counter for ${metricName}`);
    counters[metricName] = meter.createCounter(metricName, {
      description: `${metricName} counter`,
    });
  }

  counters[metricName].add(value, attributes);
};


export default logger;
