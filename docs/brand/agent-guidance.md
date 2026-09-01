# Merit interface guidance for agents

Read this file and `docs/brand/design-system.md` before planning or changing
product UI. Repository-specific `AGENTS.md` instructions take precedence when
they are more restrictive.

## Before editing

1. Read every applicable `AGENTS.md` and preserve the current dirty worktree.
2. Locate the actual UI owner, all `components.json` files, the shared CSS
   entrypoint, root layout, oxlint configuration, and repository validation
   command.
3. Inspect `components.json` before adding components. Respect its primitive
   library, style, aliases, RSC setting, CSS entrypoint, and registry namespace.
   The canonical `https://merit.engineering/r/{name}.json` registry is
   protected: configure it with shadcn's object form and the
   `x-vercel-trusted-oidc-idp-token` header set to
   `${MERIT_REGISTRY_OIDC_TOKEN}`. Use `merit registry` commands so the token is
   minted only for the child shadcn process. Keep local or explicitly
   unprotected registries as plain URLs and never send them an OIDC token.
4. In an established repository, audit first and propose small migration
   batches. Do not run `shadcn init`, apply a preset, change primitive bases, or
   overwrite all local primitives.

## While implementing

1. Install supported core primitives such as Button, Card, Dialog, Input, and
   Table from `@merit`. Use bare official shadcn items only when the component
   is outside the documented Merit core.
2. Use `@merit` for Foundation-owned core primitives, assets, compositions,
   and guidance.
   For chat interfaces, install the AI Elements-aligned `@merit/conversation`,
   `@merit/message`, `@merit/prompt-input`, `@merit/reasoning`,
   `@merit/shimmer`, and `@merit/tool` items instead of adding the generic
   `@ai-elements` versions or reconstructing their presentation locally. These
   install under `components/ai-elements` so existing AI Elements imports and
   agent knowledge remain applicable. Keep runtime message adapters, tool
   schemas and registries, product icons, authorization, persistence, and
   specialized tool results with the consuming application.
3. New projects use `@merit/merit-base`. In an established project, keep the
   current source working through the Brand slot adapter and replace primitives
   progressively with `merit registry add @merit/<name> --diff`.
4. Use semantic surface tokens such as `bg-background`, `bg-card`,
   `text-foreground`, `text-muted-foreground`, `border-border`, and `ring-ring`.
   Use the `success`, `warning`, `information`, and `destructive` token families
   for reusable UI states. Prefer a state-bearing component's semantic
   `variant` when available.
5. Let Foundation-owned primitives select their semantic `type-*` roles. Keep
   `@merit-systems/brand/shadcn.css` installed as a compatibility fallback for
   upstream or not-yet-migrated source; do not reconstruct recurring recipes at
   callsites.
   Plain `p` and `span` elements inherit typography; when either directly
   applies font family, size, weight, leading, or tracking utilities, select the
   catalog role matching the content's purpose. Color, layout, truncation, and
   accessibility classes do not require a typography role.
6. When typography lint emits a `typography/*` code, run the complete
   `pnpm exec merit typography explain <code> --json` command from the finding.
   If semantic intent is still ambiguous, run
   `pnpm exec merit typography resolve --kind <kind> --scope <scope> --element <element> --json`.
   Use an exact result, preserve a candidate set when intent is incomplete, and
   never guess a role. Correct source, rerun lint, and confirm the finding is
   gone.
7. Use `Button variant="quiet"|"plain" size="none"` for inline controls,
   `Button variant="surface"` for complete clickable surfaces, and
   `InputGroup size="default"|"lg"|"xl"` instead of rebuilding their visuals
   with Tailwind classes. Alert, Badge, and PulseDot use finite semantic
   variants. Button deliberately has no success, warning, or information
   variants; put that meaning on the state-bearing component and keep the
   related action on the constrained Button variant set.
8. Define only `--primary`, `--primary-foreground`, and `--ring` as product
   identity in the owning global stylesheet. Keep business workflows in the
   product repository. Preserve documented chart, protocol, provider, and
   user-configured color semantics.
9. Review registry and primitive updates with `--dry-run` or `--diff` before
   overwriting locally modified source.
10. Preserve focus, keyboard, reduced-motion, responsive, light-mode, and
    dark-mode behavior.
11. Treat the Foundation `ui` capability owner as the one UI enforcement
    owner. Add `ui:check` and `ui:integrity` there, not to every package with a
    components folder. The root check schedules both package leaves through
    Turbo. Cache `ui:integrity` against the owner's registry, TypeScript,
    component-source, and stylesheet inputs plus the root Foundation config
    and lockfile.
12. For authored MDX, install `@merit/typeset` and map `wrapper` to
    `TypesetMdxWrapper` and `table` to `TypesetTable` in `useMDXComponents`.
    Keep embedded application UI outside prose styling with `data-not-typeset`.
    Parsing remains adopter-owned: add `remark-gfm` only when GFM syntax is
    used, and configure Next.js 16/Turbopack with the serializable
    `remarkPlugins: ["remark-gfm"]` form. Use one source for rendered MDX and
    downloadable or machine-readable Markdown when they must match; otherwise
    document and test them as intentionally separate contracts. Do not invent
    a product-specific generator by default.

## Before handing off

1. Run the design-system owner's `ui:check` and `ui:integrity` tasks, the
   relevant oxlint command, focused type/tests, and the repository's full
   required check.
2. Browser-test representative affected routes in light and dark mode.
3. Report changed ownership boundaries, preserved exceptions, verification
   evidence, and remaining migration-ledger items.
