# Merit design-system contract

## Layers

- Foundation's `@merit` registry owns the supported Base UI core primitives.
- `@merit-systems/brand` owns shared semantic tokens, typography, motion contracts, and canonical first-party assets.
- The `@merit` registry also owns Merit-specific guidance, components, and compositions.
- The official shadcn registry remains the behavior and accessibility upstream for mirrored primitives and owns components outside the Merit core.
- Product repositories own workflows, domain behavior, layouts, and necessary local extensions.

## Theme setup

Import `tailwindcss`, then `shadcn/tailwind.css`, followed by the Merit
foundation, typography contract, shadcn typography adapter, optional motion
contract. Define `--primary`, `--primary-foreground`, and `--ring` for light
and dark mode in the owning global stylesheet.

The upstream shadcn stylesheet owns behavior-oriented Tailwind variants such as
`data-active`, `data-open`, `data-horizontal`, and `data-vertical`. The Merit
foundation owns the semantic contract those components consume; the
application owns only its three primary identity values. Do not remove either
layer.

Import `@merit-systems/brand/typography.css`; do not load a second product font.
Import `@merit-systems/brand/shadcn.css` after it so established upstream or
Radix source receives compatible default typography through `data-slot`
hooks. Foundation-owned primitives select semantic roles directly; the adapter
is the transition path, not their primary typography owner.
Choose one generated semantic recipe whenever its intent matches. Use the Body,
UI, Signal, or Mono foundation with one approved scale only as an explicit
escape hatch. The selected production profile owns family, weight, tracking,
and leading values; never repeat those numbers in application source. Reserve
the `type-emphasis` modifier for short semantic emphasis rather than applying
it to the whole hierarchy.

Keep ordinary Text and Mono tracking at zero. Use tabular Merit figures for
aligned financial values; do not switch every number to Mono. Merit Mono keeps
programming characters literal and should not have programming ligatures or
stylistic sets enabled over it. The family is upright-only, and the shared
contract disables synthetic styles. Establish hierarchy with size, spacing,
color, and 450 before reaching for 575; use 575 or color rather than fake
italics for genuine emphasis.

## Registry access

The canonical `https://merit.engineering/r/{name}.json` registry is protected
from unauthenticated automation. Configure `@merit` with shadcn's registry
object form and set `x-vercel-trusted-oidc-idp-token` to
`${MERIT_REGISTRY_OIDC_TOKEN}`. Use `merit registry` commands to mint a
short-lived token only for the child shadcn process; never persist or print it.
Plain string URLs remain valid for local or explicitly unprotected registries;
never send an OIDC token to those origins.

## Primitive policy

Use `@merit/merit-base` for new projects. It pins the supported Base UI Nova
baseline and installs the Foundation-owned core.

Radix remains a supported compatibility base for established applications.
Adopt the Brand package and its slot adapter first, then migrate one component
and its callsites at a time with `merit registry add @merit/<name> --diff`. Preserve
local variants and product behavior, and allow Radix and Base UI to coexist
while work is in progress. Do not rerun `shadcn init`, change
`components.json` as a shortcut, or overwrite all local primitives.

Product callsites select typed primitive contracts instead of reconstructing
visuals. Use quiet/plain Buttons with `size="none"` for inline controls,
`variant="surface"` for complete clickable surfaces, and the 32px/40px/48px
InputGroup size scale. Reusable success, warning, information, and destructive
states use semantic foreground, subtle-surface, and border tokens. Alert,
Badge, and PulseDot expose the same finite semantic variants. Button does not
expose success, warning, or information variants: put the state on the
surrounding component and use a constrained action variant.
Keep protocol, provider, chart, and user-configured colors product-owned.

## Component promotion test

Promote code into the Merit registry only when it is a stable corporate-brand requirement or when essentially the same component has emerged in multiple products. Do not promote product workflows or speculative abstractions.

## AI interfaces

Foundation mirrors the established AI Elements component boundaries for
`conversation`, `message`, `prompt-input`, `reasoning`, `shimmer`, and `tool`.
Install their `@merit/<name>` registry items rather than the generic
`@ai-elements` item. The installed paths remain `components/ai-elements/*` so
AI Elements documentation and familiar composition patterns still apply while
Foundation source integrity can detect drift.

The shared components own presentation, interaction, streaming disclosure,
attachment mechanics, and the finite tool-status vocabulary. Products own
runtime message conversion, session and persistence behavior, authorization,
tool schemas and component registries, tool names and icons, and specialized
input or result rendering.
Use the shared `ToolHeader` structure while supplying consumer-owned leading
icons, status-icon overrides, and metadata such as pricing or elicitation state
through its `icon`, `statusIcon`, and `meta` slots.

## Authored Markdown

Foundation Typeset owns the presentation boundary for authored MDX. Map
`TypesetMdxWrapper` and `TypesetTable` through `useMDXComponents`, use
`TypesetLead` for lead paragraphs, and mark embedded application UI with
`data-not-typeset`. Markdown parsing stays with the adopting framework; install
`remark-gfm` only for GFM syntax and use the serializable
`remarkPlugins: ["remark-gfm"]` form with Next.js 16/Turbopack.

Rendered MDX and downloadable or machine-readable Markdown use one source when
they must match. If they intentionally differ, define and test them as separate
contracts rather than assuming a product-specific generator.

## Assets

The package contains canonical first-party Merit and product assets. Third-party provider logos remain with the product that uses them. Confirm redistribution rights before packaging font binaries or licensed artwork.

## Continuous enforcement

Use the shared Foundation React or Next.js oxlint preset, which includes the
recommended Brand source rules, and run
`merit ui check --root <repository-root>` and
`merit ui integrity check --root <repository-root>` from the same package
that owns and extends the shared oxlint configuration. That lint-owning package
declares `oxlint`, `oxlint-tsgolint`, `ui:check`, and `ui:integrity`. It is the
one Foundation `ui` capability owner; do not duplicate these tasks in every
package with a components folder. The repository root's direct
`@merit-systems/foundation` dependency supplies the CLI to workspace scripts;
do not add Foundation or the Oxlint plugin to the UI package solely to expose
the binary. The root check schedules both leaves through Turbo. Keep
`ui:integrity` separately cacheable with inputs for the owner's registry and
TypeScript configuration, component source, owning stylesheet, root Foundation
configuration, and lockfile.
The project checker verifies package and registry installation, guidance
activation, stylesheet order, product identity ownership, protected tokens,
and raw CSS colors. Agents still own semantic judgment, documented exceptions,
accessibility, and visual verification.
