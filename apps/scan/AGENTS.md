# Package guidance

Owns the x402scan Next.js product UI and server routes. Keep UI primitives in `src/components/`, routes in `src/app/`, and environment access behind the package environment modules.

Validate with `pnpm --filter @x402scan/app types:check`, `pnpm --filter @x402scan/app test`, and the package UI checks. Run `pnpm check` before handing off repository-wide changes.
