# Package guidance

Owns the private HTTP proxy service. Keep server implementation in `src/` and preserve its build and start entry points.

Validate with `pnpm --filter @x402scan/proxy types:check` and `pnpm --filter @x402scan/proxy build`. Run `pnpm check` before handing off repository-wide changes.
