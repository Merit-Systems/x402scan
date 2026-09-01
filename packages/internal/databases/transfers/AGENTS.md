# Package guidance

Owns the transfers Prisma schema, client generation, and transfer database access. Treat `generated/` as ephemeral output.

Validate with `pnpm --filter @x402scan/transfers-db db:generate` and `pnpm --filter @x402scan/transfers-db types:check`. Run `pnpm check` before handing off repository-wide changes.
