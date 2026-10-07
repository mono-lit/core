# Deploy the VitePress demo to Cloudflare Pages via GitHub Actions

## Context

The VitePress docs site (`mono-helper-docs`, at `packages/helper/demo/vitepress`) lives inside the
`your-org/libs` monorepo (pnpm workspace). Its content depends on a second repo, the **private**
`your-org/mono-skills`, which `mono sync` downloads into the gitignored `.mono/apps/mono-vue/` directory at
build time (the VitePress skills-history pages read session data from there). The site is served from
`https://mono-libs.netlify.app` (hard-coded as the `hostname` in the VitePress config).

This adds the first CI/CD: a GitHub Actions workflow that, on push to `main` (and on demand), checks out the
monorepo, syncs `mono-skills`, builds VitePress, and deploys the static output to Cloudflare Pages with
Wrangler.

> The "checkout Repo 2 (mono-skills)" step is **`mono sync`** — it fetches `mono-skills` over the GitHub API
> using a token, so the workflow only checks out Repo 1 (`libs`) and lets `mono sync` pull Repo 2.

### Decisions
- **Deploy mechanism:** `cloudflare/wrangler-action@v3` running `pages deploy`.
- **Trigger:** push to **any branch** (`branches: ['**']`) filtered to the vitepress path, plus manual
  `workflow_dispatch`. Deploy passes the libs branch name to `--branch=${{ github.ref_name }}`, so `main`
  is a production deploy and any other branch is a Cloudflare **preview** deploy at
  `<branch>.mono-libs.netlify.app`. Concurrency is grouped per-branch so parallel branch builds don't cancel
  each other. `mono-skills` always syncs from `main` (mono.config.ts has no branch ref), independent of the
  libs branch — for this to behave correctly the Cloudflare project's **production branch must be `main`**.
- **Sync token:** GitHub repo **Secret** `MONO_HELPER_GITHUB_TOKEN`; CI does not use the committed `.env.dev`.

> Security: `demo/vitepress/.env.dev` previously held a real committed token (`ghp_…`). It has been scrubbed
> to a placeholder and the live token MUST be revoked/rotated.

## Key facts

| Thing | Value |
|---|---|
| Monorepo remote | `github.com/your-org/libs` (branch `main`) |
| VitePress package name | `mono-helper-docs` |
| Package path | `packages/helper/demo/vitepress` |
| Package manager | pnpm (lockfile v9.0) — pnpm 9 |
| Node | Node 20 LTS in CI |
| Build | `vitepress build docs` → `docs/.vitepress/dist` |
| Sync | `mono sync` → downloads `your-org/mono-skills` → `.mono/apps/mono-vue/` |
| Sync auth | `mono.config.ts` `apps[0].envToken = "MONO_HELPER_GITHUB_TOKEN"` (from `process.env`) |
| Target | `mono-libs.netlify.app` → Pages project `mono-libs` |
| Skills at build | `docs/.vitepress/skills/collect-skills.ts` scans `.mono/apps/*/history/**`, populated by `mono sync` |

## Changes made
1. `demo/vitepress/package.json` — added `"mono:sync:prod": "dotenv -e .env -- mono sync"` (prod uses `.env`,
   while `mono:sync` keeps using `.env.dev` for local dev).
2. `demo/vitepress/.env.dev` — scrubbed live token to a placeholder.
3. `demo/vitepress/.gitignore` — added `.env` so the prod token file is never committed.
4. `.github/workflows/deploy-vitepress-docs.yml` (repo root) — the deploy workflow (checkout → pnpm/Node →
   install → write `.env` from secret → `mono:sync:prod` → build → wrangler `pages deploy`).

Env convention: `.env.dev` = local dev (`mono:sync`), `.env` = production (`mono:sync:prod`). CI creates
`.env` from the `MONO_HELPER_GITHUB_TOKEN` secret at runtime.

5. `demo/vitepress/package.json` — added `dotenv-cli@^11.0.0` to devDependencies, and regenerated
   `pnpm-lock.yaml`. Without it the package's `node_modules/.bin/dotenv` was never linked, so on the
   GitHub runner `dotenv -e .env` fell through PATH to the system Ruby `dotenv` gem (`/usr/local/bin/dotenv`),
   which doesn't accept `-e` → `OptionParser::InvalidOption`. `dotenv-cli` was already used by sibling
   packages and present in the lockfile; it just wasn't declared here.
6. `demo/vitepress/package.json` — added `@iconify-json/mdi@^1.2.3` (same "declared-by-sibling-not-here"
   gap): `uno.config.ts` `presetIcons` loads the `mdi` collection from this package, so without it every
   `i-mdi-*` icon in synced content rendered blank (`[unocss] failed to load icon`).
7. Deploy step — replaced `cloudflare/wrangler-action@v3` with a direct `pnpm exec wrangler pages deploy`
   step, and added `wrangler@^4` to devDependencies. The action installs Wrangler with `npm`, which fails
   in this dir because the package uses pnpm `workspace:*` deps that npm can't resolve. Running the
   workspace-installed wrangler via pnpm avoids npm entirely; wrangler reads `CLOUDFLARE_API_TOKEN` /
   `CLOUDFLARE_ACCOUNT_ID` from env. Also bumped `setup-node` to Node 22 (Node 20 runner deprecation).
8. `demo/vitepress/wrangler.toml` (new) — single source of truth for the deploy: `name = "mono-libs"` and
   `pages_build_output_dir = "docs/.vitepress/dist"`. The deploy step is now just
   `pnpm exec wrangler pages deploy --branch=main` — no project name or path hardcoded in the YAML. To
   rename the project later, change `name` here (and create the matching Cloudflare Direct Upload project).
   The `hostname` in `docs/.vitepress/config.ts` is a separate value (llms.txt absolute URLs); keep it in
   sync with the `*.pages.dev` URL if the project is ever renamed.

## Secrets (GitHub → repo `your-org/libs` → Settings → Secrets and variables → Actions)

| Secret | What it is |
|---|---|
| `MONO_HELPER_GITHUB_TOKEN` | Fresh GitHub PAT with read access to private `your-org/mono-skills` (fine-grained `Contents: Read`, SSO-authorized for `your-org`). |
| `CLOUDFLARE_API_TOKEN` | Cloudflare token with **Account → Cloudflare Pages → Edit**. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID. |

## Verification
1. Local: `pnpm -w install` → `pnpm --filter mono-helper-docs run mono:sync:ci` (token exported) →
   `pnpm --filter mono-helper-docs run build` → `pnpm --filter mono-helper-docs run preview`.
2. Push to `main` (or manual dispatch); all steps green in Actions.
3. Open `https://mono-libs.netlify.app`; confirm site + populated skills-history page.
4. Confirm old token revoked and `.env.dev` holds no live value.
