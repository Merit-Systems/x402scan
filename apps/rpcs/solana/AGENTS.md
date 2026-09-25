# Package guidance

Owns the Cloudflare Solana RPC worker. Keep worker code in `src/` and deployment configuration local to this package.

Validate with `pnpm --filter @x402scan/solana-rpc types:check` and `pnpm --filter @x402scan/solana-rpc test`. Run `pnpm check` before handing off repository-wide changes.
