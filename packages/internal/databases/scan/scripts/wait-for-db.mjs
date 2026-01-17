import { neon } from '@neondatabase/serverless';

const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 1000;

async function waitForDatabase() {
  const databaseUrl = process.env.SCAN_DATABASE_URL_UNPOOLED;

  if (!databaseUrl) {
    console.log('SCAN_DATABASE_URL_UNPOOLED not set, skipping wait');
    process.exit(0);
  }

  console.log('Waiting for Neon database to be ready...');

  const sql = neon(databaseUrl);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await sql`SELECT 1`;
      console.log(`Database ready after ${attempt} attempt(s)`);
      process.exit(0);
    } catch {
      console.log(
        `Attempt ${attempt}/${MAX_RETRIES}: Database not ready, retrying in ${RETRY_INTERVAL_MS / 1000}s...`
      );
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }
  }

  console.error(
    `Database not ready after ${MAX_RETRIES} attempts (${(MAX_RETRIES * RETRY_INTERVAL_MS) / 1000}s)`
  );
  process.exit(1);
}

waitForDatabase();
