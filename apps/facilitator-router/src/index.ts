// Import logger first to initialize OpenTelemetry tracing before other imports
// This ensures HTTP/Express requests are automatically traced
import './logger';

import type { Request, Response } from 'express';
import express from 'express';
import logger from './logger';
import { env } from './env';
import { errorHandler } from './utils/express-result';
import { initFacilitatorEventsTable } from './db/clickhouse';
import { settleHandler } from './routes/settle';
import { verifyHandler } from './routes/verify';
import { traceEnrichmentMiddleware } from './utils/trace-enrichment-middleware';

const app = express();
const port = env.PORT;

// OpenTelemetry trace enrichment middleware - must be before express.json()
app.use(traceEnrichmentMiddleware);
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Settle endpoint
app.post('/settle', settleHandler);

// Verify endpoint
app.post('/verify', verifyHandler);

// Global error handler (should be last)
app.use(errorHandler);

// Initialize ClickHouse tables before starting the server
async function initializeDatabase() {
  logger.info('Initializing ClickHouse tables...');

  const eventsTableResult = await initFacilitatorEventsTable();
  eventsTableResult.match(
    () => logger.info('Facilitator events table initialized'),
    error =>
      logger.error('Failed to initialize facilitator events table', {
        error: error.message,
      })
  );
}

// Start the server
initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log('\nAvailable endpoints:');
      console.log('  GET  /health - Health check');
      console.log('  POST /settle - Settlement endpoint');
      console.log('  POST /verify - Verification endpoint');
    });
  })
  .catch(error => {
    logger.error('Failed to initialize database', { error: error as Error });
    process.exit(1);
  });
