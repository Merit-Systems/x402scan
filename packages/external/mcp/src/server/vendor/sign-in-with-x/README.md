# Vendored: Sign-In-With-X Extension

**This is a temporary vendored copy of `@x402/extensions/sign-in-with-x`.**

## Why Vendored?

The `@x402/extensions` package is not yet published to npm. It lives in the x402 monorepo at:
https://github.com/coinbase/x402/tree/main/typescript/packages/extensions

Bun cannot install packages from GitHub monorepo subdirectories, and the package uses `workspace:*` protocol internally which breaks external installation.

## Source

Copied from: `sragss/x402` branch `siwx-extension`
Path: `typescript/packages/extensions/src/sign-in-with-x/`

## When to Remove

Once `@x402/extensions` is published to npm:

1. Delete this entire `src/vendor/sign-in-with-x/` directory
2. Add `"@x402/extensions": "^2.x.x"` to package.json dependencies
3. Update imports from `../vendor/sign-in-with-x/index.js` to `@x402/extensions/sign-in-with-x`
4. Remove `siwe` from direct dependencies (becomes transitive)

## License

Apache-2.0 (same as x402)
