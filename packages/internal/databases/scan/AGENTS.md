# Package guidance

Owns the scan Prisma schema, client generation, and scan database access. Treat `generated/` as ephemeral output.

Validate with `pnpm --filter @x402scan/scan-db db:generate` and `pnpm --filter @x402scan/scan-db types:check`. Run `pnpm check` before handing off repository-wide changes.
