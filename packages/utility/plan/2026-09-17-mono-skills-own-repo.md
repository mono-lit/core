# `mono skills` — user-owned repository, git transport

Supersedes `2026-06-20-mono-skills-cli.md`. The CLI shell, the staged-session standard,
validation, redaction and chunking are unchanged; what changed is **where** sessions go
and **how** they get there.

## Why
The first version pushed every app's history to one hard-coded company repo
(`your-org/mono-skills`) through the GitHub REST Contents API (one commit per file, github
only, PAT always required), switched on by `MONO_SKILLS` + `MONO_SKILLS_GITHUB_TOKEN`, and a
VitePress deploy re-rendered that repo into `/llms-skills.txt`. Re-deploying docs per sync
was not worth it, and users want their own repository.

## Contract (enforced in code)
- **`skill` in `mono.config.ts` is the switch and the target.**
  `skill: { url, envToken? }` — `url` is a plain clone URL (any git host, `.git`/`ssh`) or
  a GitHub deep URL `…/tree/<ref>/<dir>` (branch + subfolder). `envToken` is the env var
  NAME of a PAT (same as `apps[].envToken`). Absent → every repo command prints
  `{ skipped: true, reason: 'MONO_SKILLS_NOT_CONFIGURED' }`; `check` always runs.
- **Read from THIS config file only** (`extractSkill` text-parse in `mono-alias.ts`, like
  `apps[]`); never inherited through `extends` (`MonoMergeableKey` excludes it,
  `resolveLayer` strips it — same rule as `template`).
- **Transport = git, git-first.** `ls-remote` with the machine's own credentials; on
  `no-access` only (not network/timeout/no-git), retry with `tokenRemote(url, token)`
  (`x-access-token:` on github.com, `oauth2:` elsewhere; https only). The tokenized URL is
  a positional argument to `ls-remote`/`fetch`/`push` — `.git/config` keeps the plain
  URL; every stderr line passes `redactUrl()`.
- **One commit per session**, pushed to the resolved branch. Non-fast-forward → fetch,
  `reset --hard origin/<ref>`, re-`apply` (immutability re-checked), commit, push; ≤ 3
  attempts. Safe because the layout is folder-per-user/session and `app.json`/`user.json`
  are create-once.
- **Local clone** `.mono/skills/repo/` (single branch, full history). `read`/`search`/
  `session show` refresh it when older than 10 min and serve it `stale: true` offline;
  `save` always refreshes first; `sync` refreshes on demand.
- Argument guard unchanged: only `--app --dir --type --path --query --limit --session-id
  --dry-run`.

## Layout
- `src/composables/create-config.ts` — `MonoSkillConfig`, `MonoConfig.skill`.
- `src/composables/mono-alias.ts` — `extractSkill(dir)`.
- `src/skills/config.ts` — `SKILLS_DEFAULTS` (+ `repoDir`, `refreshTtlMs`, `pushAttempts`,
  `gitTimeoutMs`), `loadSkillConfig`, `SkillTarget`, `resolveSkillTarget` (URL grammar).
- `src/skills/git.ts` — TS port of the `bin/mono-git.mjs` primitives (`runGit`,
  `classifyGitFailure`, `firstFatal`, `refDirCandidates`, `parseLsRemote`) +
  `redactUrl`, `tokenRemote`, `parseSymref`, `parseHeadSha`, `isNonFastForward`.
- `src/skills/repo.ts` — `resolveRemote` (probe + transport fallback, deep-URL split,
  empty-remote handling), `ensureRepo` (init/refresh/stale), `commitAndPush` (replay
  loop), `readRepoFile`/`listRepoFiles`/`skillsRoot`, `SkillsAccessError`.
- `src/skills/save.ts` — `buildSavePlan` (offline), `applyPlan` (idempotent, create-once
  bootstrap, refuses an existing session), `runSave`. `github.ts` deleted.
- `src/skills/{read,session,check}.ts` — clone-backed; `check` reports transport /
  ref / dir / `canPush` via `push --dry-run`.
- `pkg/cli/skills/_shared.ts` — `requireSkillConfig`, `connect`, `describeRemote`
  (replacing `continueIfEnabled` / `requireToken`). New commands `init` (skeleton for the
  manual flow) and `sync`. `whoami`/`pending`/`failed` no longer gated.
- Tests: `tests/skills-config.test.ts`, `tests/skills-git.test.ts`,
  `tests/skills-e2e.test.ts` (real `git init --bare`, no network: save, immutability,
  create-once, push-race replay, read/search/session, check, empty remote).
- VitePress: the `mono-vue` pseudo-app, `collect-skills`, `llms-skills` plugin, flag,
  history pages/components and the tracked `.env.dev` token are gone; `docs/ai/skills.md`,
  template Rule 17, `prompting.md`, `repo/config.md` rewritten.

## Verified
- `vitest run --typecheck`: 30 files / 490 tests green (39 new).
- Built CLI against a temp bare repo: `check` (unconfigured → `configured:false`; configured
  empty remote), `init` → `save --dry-run` → `save` (one commit `feat(<app>): session <id>`),
  `sync`, `session show`, `read`, `--token` rejected, `.git/config` holds the plain URL.
- `check` against `https://github.com/EJI-ICT/esw-host/tree/mono/deep-folder`: `ref: mono`,
  `dir: deep-folder`, `transport: git`, `canRead`/`canPush: true`.

## Not done here
- No real session was pushed to a GitHub repo (only `push --dry-run`). First real save is
  the user's call.
- Bitbucket's `x-token-auth` user name is not special-cased (falls under `oauth2`).
