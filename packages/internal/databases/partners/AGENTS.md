# Package guidance

Owns the internal partners ClickHouse access layer. Keep query and model changes inside `src/`.

Validate with `pnpm --filter @x402scan/partners-db types:check` and `pnpm --filter @x402scan/partners-db build`. Run `pnpm check` before handing off repository-wide changes.
