# Repository guidance

<!-- foundation:type-ownership:v1 -->

## Type ownership

- Keep each TypeScript concept anchored to one source of truth.
- Before adding a `type` or `interface`, search for an existing owning export,
  schema-derived type, model inference, or function/value type that can be
  reused or derived.
- Prefer inference for implementation details and contextual callbacks.
- Add a named type only for a real domain concept, public boundary, validation
  source, or meaningfully reused composition.
- Do not mirror schemas, database rows, router inputs or outputs, SDK payloads,
  library exports, or function results with parallel interfaces.

<!-- /foundation:type-ownership -->

## Merit design system

Before planning or changing product UI:

- Read `docs/brand/agent-guidance.md` and `docs/brand/design-system.md`.
- Preserve the current `components.json` primitive base and local extensions.
- Use `@merit` for supported core primitives. In this established repository,
  replace them one at a time with `--diff`; use official shadcn only outside
  the documented Merit core.
- Run the scan app's `ui:check` and `ui:integrity` tasks and the repository's
  full `pnpm check` before handing off.

`apps/scan` owns the UI contract. Facilitator, network, protocol, chart, and
provider colors are product semantics and must remain explicit and centralized.
