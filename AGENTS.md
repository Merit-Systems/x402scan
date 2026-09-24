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

<!-- foundation:test-seams:v1 -->

## Test seams and dependency injection

- Do not introduce a factory, dependency bag, interface, optional dependency,
  mutable registry, or reset hook solely so tests can replace production code.
- Before proposing dependency injection, identify the production callers that
  select different implementations or scopes, or the state or lifecycle owned
  by the created instance.
- When no production requirement exists, use direct imports and test the stable
  owning boundary. Use a narrow test-local module mock when an external effect
  must be replaced.
- When modifying an existing injected service, trace its production call sites.
  If every caller supplies the same dependency and the instance owns no state or
  lifecycle, remove the factory rather than extending it.

<!-- /foundation:test-seams -->
