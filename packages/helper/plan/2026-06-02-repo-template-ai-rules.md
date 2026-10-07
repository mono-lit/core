# repo/template.md — AI working rules

**Date:** 2026-06-02
**Area:** `demo/vitepress/docs/repo`

## Purpose

This project is intended to be maintained largely by an AI assistant. Added a new
docs page, `repo/template.md`, that states the rules the AI must follow when writing
code in the Host or Remote templates. The page is structured in three parts —
**Common Rules** (both templates), **Host template**, **Remote template** — and is
being built incrementally.

## This iteration

Authored the **Common Rules → Rule 1: Building a new feature** (the code-separation
workflow), plus the page skeleton:

- Ask the user for the page name before creating files.
- Page (`src/pages/<name>.vue`) stays thin — UI + store wiring only.
- Extract reusable markup into `src/components/<name>/` when a page grows large
  (~5000 lines) or repeats.
- All logic (state, computed, watchers, functions, fetching) lives in a Pinia store
  `src/stores/use-<name>.ts`; fetching uses the project helpers (`monoFetch` etc.).
- Generic helpers go in `src/composables/use-<name>-utils.ts` (usually consumed by
  the store).
- Everything TypeScript; reactive data types declared in `src/types/<name>.d.ts`.
- Included a `brand` worked example: folder tree + short snippets for each layer.
- Host/Remote sections are present as headings with the high-level boundary from
  Getting Started; their detailed do/don't lists are deferred to a later iteration.

No Mermaid diagram — there is no rigid flow; the rule is simply to keep code in
those layers.

Also added **Common Rule 2: The Vite config is the core — ask before changing it**.
Documents what each plugin does (auto-import, auto-components, file routing,
layouts, unocss, vue custom-element passthrough; Host-only devtools/sentry,
Remote-only mkcert/proxy) and marks `vite.config.ts` as fixed infrastructure. Calls
out the three Host ↔ Remote connection points that must not be changed without
asking the user: `mergeEcosystem`, `resolve.alias`, and `server.fs.allow`. Source
configs reviewed: `template_vueform/mono-host/vite.config.ts` and
`template_vueform/mono-vue/vite.config.ts`. (Alias prose later genericized to
"Host" / "Remote" rather than the template names mono-host / mono-vue.)

Added **Common Rule 3: Static data lives in `src/datas`** — keep all static/constant
data (configs, option lists, column defs, labels, sample rows) in `src/datas`, never
inline. Group each piece in its own leaf file with `export default`, collect them in
an `index.ts` that default-exports one object, so consumers do a single import and
reach in by key (`import table from '@/datas/table'` → `table.transfer`). Avoids long
named-import lists. Type the data; reused shapes go in `src/types` (Rule 1). (Example file names later
genericized to users/products/orders/invoices/customers.)

Added **Common Rule 4: `mono.config.ts` — the shared config + sync core**. Explains
each field (name, extends, apps, fetching.api, fetching.auth, cookie, jwt, menu) in
a table, like the vite.config rule. Notes this file IS edited regularly (APIs,
cookies, menu) but the two Host ↔ Remote wiring fields — `extends` (merges the other
app's config) and `apps` (sync source for `pnpm mono:sync`) — require asking the
user first. Cross-links Sync, Data Fetching, Config. Source configs reviewed:
`template_vueform/mono-host/mono.config.ts` and `template_vueform/mono-vue/mono.config.ts`.

Added **Common Rule 5: Data fetching — always use `@mono-lit/utility/fetching`**. Rules:
never use external HTTP libs; a new base URL must be added to `mono.config.ts`
(`fetching.api`) and consumed via `configBaseUrl` so Host/Remote share it; when
planning a new page, ask whether it should be deployable (added to `menu`) or kept
out while in development. Establishes `monoCreateFetcher` + a reactive DataSource as
the standard (fetch once in onMounted, keep in a ref, re-query via
`source.store().load({ filter, select })` — no second fetcher). OData `select`
discipline (only needed fields; reason-then-ask). Includes a table of every
`@mono-lit/utility/fetching` export (from `packages/utility/pkg/wrapper-fetching.ts`).
Also added a "One DataSource per purpose" warning (a DataSource is a shared live
instance — binding the same one to two components cross-filters them).

Added **Common Rule 6: Never edit `.apps/` — it's synced**. `.apps/` holds the other
connected app; it's generated and feeds the aliases / mergeEcosystem / fs.allow
(Rule 2). A `danger` admonition: never edit it by hand (breaks build, overwritten on
sync); the only way to update is `pnpm mono:sync` (package.json) — see Sync.

Note: moved the starter-repo URLs out of getting-started into the Host template
(mono-host) and Remote template (mono-vue) sections of this page.

Added **Common Rule 7: UI — reach for `@mono-lit/helper/ui` first**. Priority ladder:
(1) mono-ui Lit component → (2) mono-ui native (reuse the `.mono-*` CSS, hand-build
markup) → (3) UnoCSS utilities → (4) native CSS as last resort, stored in
`src/assets/` in a specifically-named file imported only into the page that needs
it. Cross-links Mono-UI getting started.

Added **Common Rule 8: Never edit generated files** — `auto-imports.d.ts`,
`components.d.ts`, `typed-router.d.ts`, and everything under `src/odata/DTO/` are
generated (regenerated on dev/build); commit them but never hand-edit — fix the
source (a store/composable/component/page, or the OData metadata then regenerate).
Same read-only principle as Rule 6 (`.apps/`). Found while exploring
`template_vueform/mono-host` and `mono-vue`. (Other candidates from that exploration
— `shared/` cross-app folders and the odata2ts generation workflow — not yet added.)

Added **Common Rule 9: Shared utilities go in `src/composables/use-utils.ts`** —
global reactive/common/reusable helpers live in `use-utils.ts` (auto-imported, so
usable anywhere); feature-specific helpers stay in their `use-<name>-utils.ts`
(Rule 1). When a util group grows large, split it into its own `src/composables/`
file and re-export it through `use-utils.ts`.

## Files

- `demo/vitepress/docs/repo/template.md` (new).
- `demo/vitepress/docs/.vitepress/config.ts` — added **Template** to the Mono-Repo
  sidebar (after Getting Started).

## Follow-ups

- Fill in the **Host template** do/don't rules.
- Fill in the **Remote template** do/don't rules (e.g. never edit synced `.apps/`
  code, don't re-create the Host-owned shell).
- Add further Common Rules as they're decided.

## Verification

1. `pnpm build` / `pnpm dev` in `demo/vitepress`; **Template** shows in the sidebar,
   `repo/template` renders.
2. `grep -c "Building a new feature" docs/.vitepress/dist/llms-full.txt` → 1.
