# Package guidance

Owns Trigger.dev transfer indexing jobs and their tests. Keep chain-specific ingestion behavior and probes inside this package.

Validate with `pnpm --filter @x402scan/sync-transfers types:check` and `pnpm --filter @x402scan/sync-transfers test`. Run `pnpm check` before handing off repository-wide changes.
