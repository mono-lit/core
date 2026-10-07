# Basecoat UI — vendored source

@mono-lit/helper's styling and theming are a **port of [Basecoat UI](https://basecoatui.com)**
(shadcn/ui-compatible tokens, `vega` style). Basecoat is the source of truth: every
component rule that can come from it mirrors it and cites it; anything Basecoat lacks
is a marked extension written in Basecoat's idiom.

Nothing in this folder is imported by a build. `basecoat-css` is an **exact
devDependency** only — consumers never install it and `dist/ui/index.css` stays
self-contained. This copy exists so that:

- a version bump shows up as an ordinary `git diff` of readable `@apply` source;
- `blocks.json` (a per-selector fingerprint of every vendor rule) lets
  `basecoat-cite changed` list exactly which ported rules have a moved upstream;
- `basecoat-vega.cdn.css` (the compiled, Tailwind-resolved CSS) is the **value**
  source ports copy from, while citations key to `styles/vega.css` / `components/*.css`.

| File | Role |
|---|---|
| `manifest.json` | version, Tailwind version, sha256 per tracked file |
| `blocks.json` | `{ "<file>": { "<selector>": sha1(declarations) } }` — nested rules keyed `parent >> &child` |
| `base/base.css` | the `:root` / `.dark` tokens and the `@theme` map |
| `styles/vega.css` | the vega look, as `@apply` rules |
| `components/*.css` | structural base rules per component |
| `basecoat-vega.cdn.css` | compiled plain CSS (no Tailwind needed to read it) |

## Citations

Every ported rule opens with:

```css
/* basecoat@1.0.2 styles/vega.css .btn[data-size='sm'] */
/* basecoat@1.0.2 components/button.css .btn — mono: dark variants via --mono-mode-* tokens */
```

`basecoat@<version> <vendor file> <selector exactly as upstream writes it>[ — note]`.
Rules without a citation are, by definition, mono extensions and carry
`/* EXTENSION — <why> */` instead.

## Scripts

| Command | Does |
|---|---|
| `pnpm basecoat:sync` | copy from `node_modules/basecoat-css`, rewrite `manifest.json` + `blocks.json`, regenerate the token layer |
| `pnpm basecoat:check` | exit 1 if this folder drifted from the installed package (also run by `tests/basecoat-vendor.test.ts`) |
| `node scripts/basecoat-cite.mjs list` | every citation grouped by vendor block |
| `node scripts/basecoat-cite.mjs verify` | every citation resolves and is pinned to the manifest version |
| `node scripts/basecoat-cite.mjs changed [--since <ref>]` | citations whose vendor block changed since `<ref>` (default `HEAD`) |

## Bumping Basecoat

1. `pnpm add -D -E basecoat-css@<new>` (exact pin — the test enforces it).
2. `pnpm basecoat:sync`.
3. `git diff src/data/theme/vendor/basecoat` — read what moved in `styles/vega.css`.
4. `node scripts/basecoat-cite.mjs changed --since HEAD` — the checklist of ported rules to revisit.
5. Re-port each listed rule from `basecoat-vega.cdn.css`, update its `basecoat@<version>` pin.
6. `pnpm theme:check`, `pnpm basecoat:check`, `node scripts/basecoat-cite.mjs verify`, `pnpm test:perf`.
