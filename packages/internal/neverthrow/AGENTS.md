# Package guidance

Owns shared result/error utilities. Keep the public surface small and avoid adding product-domain behavior here.

Validate with `pnpm --filter @x402scan/neverthrow types:check` and `pnpm --filter @x402scan/neverthrow build`. Run `pnpm check` before handing off repository-wide changes.
