import { neon } from "@neondatabase/serverless";

import { env } from "../src/env.ts";

const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 1000;

function describeFailure(error) {
  const causes = [error, error instanceof Error ? error.cause : undefined];
  const details = causes.flatMap((cause) => {
    if (!(cause instanceof Error)) return [];

    const result = [`name=${cause.name}`];
    if ("code" in cause) {
      result.push(
        `code=${String(cause.code)
          .replace(/[^a-zA-Z0-9_]/g, "")
          .slice(0, 32)}`
      );
    }
    if ("status" in cause) {
      result.push(
        `status=${String(cause.status)
          .replace(/[^0-9]/g, "")
          .slice(0, 3)}`
      );
    }
    return result;
  });

  return [...new Set(details)].join(", ") || "unclassified error";
}

async function waitForDatabase() {
  const databaseUrl = env.SCAN_DATABASE_URL_UNPOOLED;

  if (!databaseUrl) {
    console.log("SCAN_DATABASE_URL_UNPOOLED not set, skipping wait");
    process.exit(0);
  }

  console.log("Waiting for Neon database to be ready...");

  const sql = neon(databaseUrl);
  let lastFailure;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await sql`SELECT 1`;
      console.log(`Database ready after ${attempt} attempt(s)`);
      process.exit(0);
    } catch (error) {
      lastFailure = error;
      console.log(
        `Attempt ${attempt}/${MAX_RETRIES}: Database not ready, retrying in ${RETRY_INTERVAL_MS / 1000}s...`
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }
  }

  console.error(
    `Database not ready after ${MAX_RETRIES} attempts (${(MAX_RETRIES * RETRY_INTERVAL_MS) / 1000}s): ${describeFailure(lastFailure)}`
  );
  process.exit(1);
}

void waitForDatabase();
