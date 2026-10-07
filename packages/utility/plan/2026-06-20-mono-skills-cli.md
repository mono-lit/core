# `mono skills` CLI — design & implementation

> **Superseded by `2026-09-17-mono-skills-own-repo.md`.** The fixed `your-org/mono-skills` target, the
> REST transport and the `MONO_SKILLS*` env switches described below no longer exist; the repository
> is now chosen per app via `skill` in `mono.config.ts` and reached over git.

A citty-based `mono skills <command>` CLI inside `@mono-lit/utility`, built to be **run by
an AI**, that bridges a MONO app and the private knowledge/history repo
`your-org/mono-skills` (branch `main`). All GitHub access for this workflow goes
through this CLI; the caller never touches GitHub directly.

## Hard contract (enforced in code)
- **Fixed remote target** — `your-org/mono-skills@main` lives in
  `src/skills/config.ts` as a frozen object. No flag/arg/env can retarget it.
- **Off by default** — only enabled when `MONO_SKILLS ∈ {true,1,yes,on}` (case-
  insensitive). When off, mutating/remote commands print
  `{ success:true, skipped:true, reason:"MONO_SKILLS_DISABLED" }` and do nothing;
  only `check` always runs (to report the disabled state).
- **Token safety** — `MONO_SKILLS_GITHUB_TOKEN` is read from the env only, used
  solely in the `Authorization: Bearer` header, and never printed/logged/argv'd.
- **Argument allowlist** — only `--app --dir --type --path --query --limit
  --session-id --dry-run`. A guard rejects everything else (esp. `--token/--owner/
  --repo/--branch/--url`).
- **JSON-first** — every command prints one JSON object to stdout; human report
  lines (saved path) go to stderr.

## Layout
- **CLI shell** `pkg/cli/skills/` — `index.ts` (root `defineCommand` + `runMain`),
  `_shared.ts` (printJson/fail/guardArgs/prelude/continueIfEnabled/requireToken),
  `commands/{check,whoami,read,search,save,retry,pending,failed,session}.ts`.
  `session` nests `show`.
- **Core** `src/skills/` — `config` (frozen target, switch, token, dotenv-quiet),
  `types`, `github` (Contents/Trees client over `node:https` incl. PUT; reuses
  mono-clone's retry/agent; non-destructive write-check via `permissions.push`),
  `actor` (git identity → `<slug>__<sha256(email)[:6]>`), `appid` (resolve from
  `--app` / `.mono/apps/<name>` / `extractConfig(cwd).name`; normalize; reject
  traversal), `staging` (`.mono/skills/{pending,failed,cache}`), `redact` (second
  pass: PATs, Bearer, AWS keys, PEM, secret env, cookies, DB URLs → `[REDACTED]`),
  `chunk` (750 KB JSONL parts on line boundaries), `save` (build plan → immutable
  dest → ensure app.json/user.json → refuse overwrite → PUT → cleanup/move-failed),
  `read`/`search` (Trees+Contents, local ranking; never bulk-load conversations),
  `check`, `session`.

## Wiring
- `bin/mono.mjs`: `skills: 'mono-skills.js'` in `targets` + usage line.
- `tsdown.config.ts`: entry `'mono-skills': './pkg/cli/skills/index.ts'`; `dotenv`
  added to `deps.neverBundle`.
- `pkg/config/node.ts`: re-exports `../../src/skills` (core importable as
  `@mono-lit/utility/config/node`).

## Permanent repo layout (written by `save`)
```
<app>/app.json
<app>/history/<actorFolder>/user.json
<app>/history/<actorFolder>/YYYY-MM-DD/HH-mm-ss_<sessionId>/
    metadata.json summary.md index.json [files-changed.json] [decisions.json]
    conversation/part-0001.jsonl ...
```
Session folders are immutable — `save` refuses if `…/metadata.json` already exists.
Destination time comes from `metadata.finishedAt` (else now).

## Verified locally (offline)
- `mono skills` help lists all subcommands; build keeps `citty`/`dotenv` external.
- `whoami` → skipped when disabled; `check` (disabled) reports `enabled:false`,
  never the token.
- `save --dry-run` (enabled) → immutable `savedPath` + planned files (metadata,
  summary, `conversation/part-0001.jsonl`, index); disabled → skipped.
- Redaction collapses `ghp_…`, `password=…`, `AKIA…` to `[REDACTED]`.
- Guards: `--token` rejected; `--path ../../etc` rejected; stdout stays pure JSON.

## Not testable here (needs the user's token + repo access)
`MONO_SKILLS=true` + `MONO_SKILLS_GITHUB_TOKEN=…` →
`mono skills check` (perms green) → `mono skills save …` (real upload + reported
permanent path; re-running the same session id is refused).

## Notes / future
- `search` ranking is naive term-overlap over knowledge/skills/history sidecars;
  could grow a cache under `.mono/skills/cache/` and smarter scoring.
- `.mono/` is already gitignored in all templates — staging is never committed.
