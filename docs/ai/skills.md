# Skills (for AI)

MONO apps live in **separate repositories**, so they can't see what the others have
learned. **MONO Skills** fixes that with a knowledge repository **you own**: per app, its
**knowledge**, reusable **skills**, technical **decisions**, and the **AI session history**
— so any app (and any future session) can read what was already figured out.

You point an app at that repository with one optional key in `mono.config.ts`, and
everything goes through one CLI:

```bash
mono skills <command>
```

::: tip Read before you build
When `skill` is configured, **read the app's knowledge first** for non-trivial work, and
**save a session summary after** meaningful changes. That's the loop that makes the next
session smarter.
:::

## Configure

Add `skill` to the app's `mono.config.ts`. Its **presence is the switch** — no `skill`,
no skills workflow.

```ts
// mono.config.ts
import { defineConfig } from '@mono-lit/utility/config'

export default defineConfig({
  name: 'gallery-apps',
  type: 'vue',
  skill: {
    url: 'https://github.com/my-org/app-knowledge.git',
    envToken: 'APP_KNOWLEDGE_TOKEN', // optional — the NAME of an env var
  },
  apps: [],
})
```

| `skill.url` form | Means |
| --- | --- |
| `https://github.com/org/repo.git` (or without `.git`) | The repo's **default branch**, at the **root**. |
| `https://github.com/org/repo/tree/<ref>/<dir>` | Branch `<ref>`, everything under folder `<dir>` — e.g. `https://github.com/EJI-ICT/esw-host/tree/mono/deep-folder` writes into `deep-folder/` on branch `mono`. A slashed branch (`release/v2`) still resolves: the CLI probes the remote to find which split is real. |
| `https://<any-host>/group/repo.git` | Any other git host over https (GitLab, Gitea, Azure DevOps, …), default branch, root. |
| `git@host:org/repo.git` / `ssh://…` | SSH — this machine's keys only; `envToken` is ignored. |

Both values must be **static string literals**: the CLI text-parses `mono.config.ts` (just
like `apps[]`) before it could execute it, so a computed URL reads as an invalid config —
never as a different repository.

`envToken` is the **name** of an env var (same convention as `apps[].envToken` for
`mono sync`), read from the real environment or from `.env` / `.env.dev`. It holds a
personal access token with read + write access to the repository. It is only used when
your own git credentials can't reach the repo — see [Access](#access).

::: warning Not configured must never get in the way
When `skill` is absent, every command that touches the repository is a **no-op** returning
`{ "success": true, "skipped": true, "reason": "MONO_SKILLS_NOT_CONFIGURED" }`. It must never
block, delay, or change the primary task. `mono skills check` still runs and reports
`configured: false`.
:::

::: warning Not inherited through `extends`
Like `template`, `skill` says something about **this** app — which repository holds its
history — so a Remote extending a Host never inherits the Host's `skill`. Each app that
wants the workflow declares its own (they may of course point at the same repo).
:::

::: warning Rename the app first
While an app still uses a **default template name** (`mono-host`, `mono-vue`,
`mono-vue-host`, `mono-nuxt-host`, `mono-vue-remote`), `save` and `retry` are skipped
with `{ "skipped": true, "reason": "MONO_SKILLS_GENERIC_APP_NAME" }` — history is **not**
generated under a placeholder id. Rename the app in `mono.config.ts` (and `package.json`)
to a project-specific name first (see [Template Rule 1](./template)). `mono skills check`
reports this via `genericAppName: true`.
:::

## Access

The CLI reaches the repository with **git**, in this order:

1. **Your own git credentials** — Git Credential Manager, `gh auth`, SSH keys. If you can
   `git clone` the repo, you're done; no token needed (`transport: "git"`).
2. **`envToken`** — only when step 1 fails with *no access* (not a collaborator, no or
   stale credential) **and** the URL is https. The token rides the fetch/push URL for that
   one command (`transport: "token"`), as `x-access-token` on github.com and `oauth2`
   elsewhere.

A network, proxy, or "git not installed" failure is **not** retried with a token — a token
can't fix those, and the error says so.

::: tip The token never lands anywhere
It is read from the environment, put on the URL of the individual `ls-remote` / `fetch` /
`push` call, and forgotten. The clone's `.git/config` holds the plain URL, the uploaded
`metadata.json` records the plain URL, every error line is redacted, and there are **no**
`--token` / `--url` / `--repo` / `--branch` flags (the CLI rejects them).
:::

The repository is kept as a working clone under **`.mono/skills/repo/`** (gitignored, like
everything in `.mono/`). Reads are served from it — refreshed automatically when older than
10 minutes, and still served (marked `stale: true`) when the remote can't be reached. A save
always refreshes first.

## Commands

Every command prints **one JSON object** to stdout (so it's parseable) and never prints a
token. The only accepted flags are `--app`, `--dir`, `--type`, `--path`, `--query`,
`--limit`, `--session-id`, `--dry-run`.

| Command | What it does |
| --- | --- |
| `mono skills check` | Verify setup: `skill` config, which transport reaches the repo, resolved branch/folder, read + push permission (`push --dry-run`), local clone, git identity. Never prints a token. Always runs. |
| `mono skills whoami` | Show the local git identity used for attribution: `{ name, email, actorFolder }`. |
| `mono skills init --session-id <id>` | Create a staged-session skeleton under `.mono/skills/pending/<id>/` that already passes validation — for the manual flow. |
| `mono skills read --app <id> --type knowledge\|skills` | Read an app's centralized knowledge or skills (from the clone). |
| `mono skills read --app <id> --path <file>` | Read one safe file (e.g. `knowledge/business-rules.md`). Path traversal is rejected. |
| `mono skills search --app <id> --query "<text>" [--limit 10]` | Find relevant knowledge / skills / history summaries — ranked, not a full dump. |
| `mono skills save --app <id> --dir .mono/skills/pending/<id>` | Validate, redact, commit and push a completed staged session. **The primary command.** |
| `mono skills save … --dry-run` | Validate + redact + report the planned permanent path **without** touching the network. |
| `mono skills retry --app <id> --dir .mono/skills/failed/<id>` | Re-save a previously failed session. |
| `mono skills pending --app <id>` / `failed --app <id>` | List sessions staged locally / kept after a failed save. |
| `mono skills session show --app <id> --session-id <id>` | Show a saved session's metadata + summary (no conversation). |
| `mono skills sync` | Refresh `.mono/skills/repo/` from the remote now (to browse it, or to prove access end-to-end). |
| `mono skills template` | Print the canonical staged-session file JSON standard (schemas + examples). |

::: tip App id
`--app` is normalized and, when omitted, derived from the current project
(`mono.config.ts` `name`, or the `.mono/apps/<name>` folder you're in). Pass `--app`
explicitly when in doubt.
:::

## The AI workflow

When `skill` is configured, the loop around a piece of real work is:

```text
1. mono skills check                                # confirm config + access (once)
2. mono skills read   --app <id> --type knowledge   # ground yourself
   mono skills search --app <id> --query "<topic>"  # only if relevant
3. …complete the user's task…
4. stage the session under .mono/skills/pending/<session-id>/
5. mono skills save --app <id> --dir .mono/skills/pending/<id> --dry-run   # optional
6. mono skills save --app <id> --dir .mono/skills/pending/<id>             # commit + push
7. report the permanent repoPath on success
```

A staged session is a folder with a few small files:

| File | Required | Purpose |
| --- | --- | --- |
| `metadata.json` | ✅ | Topics, user requests, commands run, validation/outcome. |
| `summary.md` | ✅ | A concise, reusable summary of what changed and why. |
| `conversation.jsonl` | when enabled | One JSON object per line (user / assistant / tool). |
| `files-changed.json` | when files changed | Path + operation metadata only (no file contents). |
| `decisions.json` | when decisions made | Title / decision / reason. |

On success the CLI returns `{ "success": true, "repoPath": "…", "commit": "…" }` and
cleans up the local staging. On failure it **preserves** the staging (moving it to
`.mono/skills/failed/<id>`) so it can be retried — and reports honestly.

## Prompting Guide

The loop above is the assistant's job, not yours — you only have to **ask for it in a way
it can't miss**. Three levels, from "once per project" to "once per prompt". Every prompt
here is copy-paste ready; `<id>` is the app's `name` from `mono.config.ts` (the CLI derives
it when `--app` is omitted, so you can usually leave it out).

### Level 1 — make it automatic (once per project)

Put the contract in the file your assistant reads on every session — `CLAUDE.md` (Claude
Code), `AGENTS.md` (Codex / most agents), `.cursorrules` (Cursor) or
`.github/copilot-instructions.md` (Copilot). After this you never mention skills again;
the assistant reads before and saves after on its own.

```md
## MONO Skills (shared knowledge + session history)

Reference: https://mono-libs.netlify.app/ai/skills.md

This app sets `skill` in `mono.config.ts`. That means, for every non-trivial task:

1. Once per session run `mono skills check`. If it reports `configured: false`, skip
   everything below silently — never let it block or change the task.
2. BEFORE changing code run `mono skills read --type knowledge`, and
   `mono skills search --query "<topic>"` when the task has a clear topic. Treat what
   comes back as decisions already made.
3. AFTER meaningful work (code, bug findings, config, decisions — not typos or
   cancelled work) stage the session under `.mono/skills/pending/<session-id>/`:
   `metadata.json` + `summary.md` at minimum (`mono skills template` prints the exact
   schema), then run `mono skills save --dir .mono/skills/pending/<session-id>` and
   tell me the returned `repoPath`.
4. Only the `mono skills` CLI — never git, gh, curl or the GitHub API for this, never
   another repository, never print or pass a token. Only claim a save succeeded on
   `{ "success": true }`; on failure say so and leave the staging in
   `.mono/skills/failed/` for `mono skills retry`.
```

::: tip Point it at the docs, not at your memory of them
The `Reference:` line matters. `https://mono-libs.netlify.app/ai/skills.md` is this page as
plain markdown; an assistant that can fetch URLs reads the current schema and safety rules
from there instead of guessing. The whole docs index is
`https://mono-libs.netlify.app/llms.txt` — see the general [Prompting Guide](./prompting).
:::

### Level 2 — one line in the prompt (no setup)

Without an instruction file, **name the workflow in the prompt**. An assistant that has
read [Template Rule 17](./template#_17-mono-skills-—-read-shared-knowledge-save-the-session)
runs the whole loop from a mention:

```text
Add a "recent transfers" panel to the budgeting page. Use mono skills: read the app's
knowledge first, and save the session when you're done.
```

Or lead with the reference so it can't be misread:

```text
Read https://mono-libs.netlify.app/ai/skills.md first and follow "The AI workflow".
Then: fix the double-encoded filter in @src/stores/use-budget-transfer.ts submitTransfer().
```

### Level 3 — drive each step yourself

When you want an exact step rather than the whole loop:

| You want… | Say |
| --- | --- |
| Confirm it's wired up | `Run mono skills check and tell me the transport, branch and whether you can push. Don't print any token.` |
| Ground it before a task | `Before you touch anything, run mono skills read --type knowledge and mono skills search --query "login redirect", and summarize what past sessions decided.` |
| Ask what's already known | `Using mono skills search, what do we already know about OData paging in this app? Read the matching knowledge files with mono skills read --path <file>.` |
| Validate before pushing | `Stage this session and run mono skills save --dir .mono/skills/pending/<id> --dry-run. Show me summary.md before the real save.` |
| Save now | `Stage what we did as a mono skills session (metadata.json + summary.md + decisions.json) and run mono skills save. Report the repoPath.` |
| Record a decision explicitly | `Add to decisions.json: we chose a custom Teleport overlay over mono-modal because the design needs an edge-to-edge image. Then save the session.` |
| Retry a failed save | `Run mono skills check, fix what it reports, then mono skills retry --dir .mono/skills/failed/<id>.` |
| Skip it this time | `Don't save a mono skills session for this — it's a typo fix.` |

### What a good result looks like

The assistant's report should contain the CLI's **actual** result, not a paraphrase:

```json
{ "success": true, "repoPath": "budgeting/history/jane__a1b2c3/2026-09-17/10-42-05_recent-transfers", "commit": "9f3e1c2" }
```

Anything else — a `skipped` reason, `"success": false`, or no JSON at all — means nothing
was pushed. The two `skipped` reasons you will meet are `MONO_SKILLS_NOT_CONFIGURED`
(no `skill` key — expected when you haven't opted in) and `MONO_SKILLS_GENERIC_APP_NAME`
(rename the app first, see [Configure](#configure)).

::: warning Prompts that backfire
- **"Push the session to GitHub"** — invites `git push` / `gh` / the API. Say *"run mono
  skills save"*; the CLI is the only sanctioned path.
- **"Use token `ghp_…`"** — never put a token in a prompt or a flag. Set `envToken` to an
  env var **name** in `mono.config.ts` and let the CLI read it.
- **"Save every session"** — greetings and cancelled work pollute the history. Let the
  assistant apply [When to save](#when-to-save-—-and-when-not-to), and say when to skip.
- **"Add `skill` to mono.config.ts for me"** — that is the user's decision (Rule 5); do it
  yourself, with a repository you own.
:::

## Manual usage (a human at the keyboard)

The AI is the main writer, but nothing about the pipeline is AI-only. To file a session
by hand:

```bash
mono skills check                                  # 1. config + access are fine?
mono skills init --session-id fix-login-redirect   # 2. skeleton under .mono/skills/pending/
#    edit .mono/skills/pending/fix-login-redirect/summary.md   (required)
#    edit metadata.json — title, topics, finishedAt; fill or delete decisions.json / files-changed.json
mono skills save --dir .mono/skills/pending/fix-login-redirect --dry-run   # 3. validates + shows the path
mono skills save --dir .mono/skills/pending/fix-login-redirect             # 4. one commit, pushed
```

If step 4 fails (no push access, network), the folder moves to `.mono/skills/failed/`;
fix the cause (`mono skills check` tells you what it is) and run
`mono skills retry --dir .mono/skills/failed/fix-login-redirect`. `mono skills sync` pulls
the repo into `.mono/skills/repo/` when you want to browse what's there; `mono skills
session show --session-id <id>` prints one session.

Curated **knowledge** and **skills** (`<app>/knowledge/*.md`, `<app>/skills/*.md`) are
plain files in that repository — edit them with git like any other docs; the CLI only reads
them.

## Session file formats (the JSON standard)

Only `metadata.json` and `summary.md` are **required**; the rest are optional. `save`/`retry` (and
`--dry-run`) **validate every staged file against this standard before committing** — a mismatch (a bad
`status`, a `decisions.json` / `files-changed.json` that doesn't use the right wrapper/fields, or an
invalid `conversation.jsonl` line) fails in the CLI and **nothing is pushed**. Match these schemas
exactly.

::: tip Get this as JSON
Run **`mono skills template`** to print this same standard (schemas + examples) as one machine-readable
JSON object — handy to consult right before staging a session. `mono skills init` writes a skeleton
that follows it.
:::

### `metadata.json` — required

Fields (from the `SessionMetadata` type):

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | `number` | `1`. |
| `sessionId` | `string` | Stable id; also names the session folder (`HH-mm-ss_<sessionId>`). |
| `status` | `"completed" \| "partial" \| "failed"` | Session outcome. |
| `startedAt` | `string?` | ISO 8601. |
| `finishedAt` | `string?` | ISO 8601. **Drives the destination timestamp** (`HH-mm-ss`, local time); falls back to save time if absent/invalid. |
| `topics` | `string[]?` | For search ranking. |
| `userRequests` | `string[]?` | What the user asked for. |
| `commandsRun` | `string[]?` | Commands executed. |
| `validation` | `{ testsRun?, testsPassed?, buildRun?, buildPassed? }?` | Booleans (`*Passed` may be `null`). |
| `outcome` | `{ result?: string, notes?: string }?` | Result summary. |

```json
{
  "schemaVersion": 1,
  "sessionId": "gallery-image-lightbox",
  "status": "completed",
  "startedAt": "2026-07-02T15:40:00.000Z",
  "finishedAt": "2026-07-02T15:53:00.000Z",
  "title": "gallery-apps: image-only lightbox on the Picsum gallery",
  "topics": ["image lightbox", "gallery", "Picsum"],
  "userRequests": ["Clicking a thumbnail should open an image-only popup…"],
  "commandsRun": ["mono skills check", "npx vue-tsc --noEmit", "npm run dev"],
  "validation": { "testsRun": false, "testsPassed": null, "buildRun": true, "buildPassed": true },
  "outcome": { "result": "shipped", "notes": "Added GalleryLightbox.vue; vue-tsc clean." }
}
```

::: tip Added automatically on save — don't stage these
The committed copy of `metadata.json` is augmented by the CLI with `app`, `actor` (`{ name, email }`),
`actorFolder`, `repository` (the plain configured URL), `savedPath`, and `uploadedAt`. Stage only your
own fields.
:::

### `summary.md` — required

Free-form markdown: a concise, reusable "what changed and why" — the highest-value artifact for the
next session. No schema.

### `files-changed.json` — optional (when files changed)

An object wrapping a `files` array; each element is `{ path, operation, note? }` with
`operation ∈ "added" | "modified" | "deleted" | "renamed"`. Path + operation metadata only — **never**
file contents.

```json
{
  "files": [
    { "path": "src/components/GalleryLightbox.vue", "operation": "added" },
    { "path": "src/pages/gallery/index.vue", "operation": "modified", "note": "wire up lightbox" }
  ]
}
```

### `decisions.json` — optional (when decisions made)

An object wrapping a `decisions` array; each element is `{ title, decision, reason }`.

```json
{
  "decisions": [
    {
      "title": "Custom Teleport lightbox over mono-modal",
      "decision": "Built a custom Teleport overlay component instead of reusing mono-modal.",
      "reason": "mono-modal always renders a padded card; the design needed an edge-to-edge image-only view."
    }
  ]
}
```

### `conversation.jsonl` — optional (when enabled)

One JSON object per line (`user` / `assistant` / `tool`). Stage a **single** `conversation.jsonl`; the
CLI redacts secrets and chunks it into `conversation/part-0001.jsonl`, `part-0002.jsonl`, … (≤ 750 KB
per part, never splitting a line). Do not pre-chunk.

### `index.json` — generated by the CLI (never stage)

The CLI writes this itself, listing every saved file in order (it does not list itself):

```json
{
  "schemaVersion": 1,
  "sessionId": "gallery-image-lightbox",
  "format": "jsonl",
  "files": ["metadata.json", "summary.md", "files-changed.json", "decisions.json"]
}
```

### Registration files — generated by the CLI (never stage)

Created once per app / per actor and never overwritten (so you can edit them by hand):

- **`<app>/app.json`** — `{ "schemaVersion": 1, "app": "<appId>", "createdAt": "<ISO>" }`.
- **`<app>/history/<actorFolder>/user.json`** — `{ "name": "<git user.name>", "email": "<git user.email>", "actorFolder": "<slug>__<6-hex>" }`.

## What gets stored

Under the configured branch and folder, the CLI writes a deterministic, per-app, per-actor,
immutable layout:

```text
<dir>/                              # '' for a plain repo URL
└─ <app>/
   ├─ app.json
   ├─ knowledge/         # stable, reusable app knowledge (curated by hand)
   ├─ skills/            # reusable step-by-step procedures (curated by hand)
   └─ history/<actor>/YYYY-MM-DD/HH-mm-ss_<session-id>/
      ├─ metadata.json  summary.md  index.json  …
      └─ conversation/part-0001.jsonl …
```

You never construct that path — the CLI does. Sessions are **immutable**: a `save`
refuses to overwrite an existing session folder.

One session is **one git commit** — `feat(<app>): session <id>`, authored with your git
identity — pushed to the configured branch. If a teammate saved in the meantime, the push
is rejected, the CLI fetches their tip, re-applies the session and pushes again (up to 3
times; `pushAttempts` in the result says how many). That replay can never conflict: every
session has its own folder, and the only shared files (`app.json`, `user.json`) are
create-once.

The date and time are **two separate path segments** — the CLI builds
`…/<actor>/<YYYY-MM-DD>/<HH-mm-ss>_<session-id>/` as `${date}/${time}_${sessionId}` (local time from
`metadata.finishedAt`, else save time). So `2026-06-29/` genuinely is its own folder containing
`07-00-00_<session-id>/`.

::: tip GitHub collapses single-child folders
GitHub's file browser folds any directory that holds exactly **one** child into a single breadcrumb
row, so a date with just one session shows as `2026-06-29/07-00-00_<session-id>` on one line. That is a
GitHub **display** convenience, not a merged or broken folder — the date splits onto its own row the
moment a second session lands on that day.
:::

## Safety

::: danger Non-negotiable
- Go through the **`mono skills` CLI only** — never call the GitHub API, `curl`, `gh`,
  or git directly for this workflow, and never target another repository.
- A **token is never printed, logged, stored, or passed as an argument**.
- A second-pass **redaction** strips secrets (tokens, keys, passwords, auth headers,
  connection strings → `[REDACTED]`) from everything saved — but still don't stage
  secrets, `.env` values, or unnecessary personal data in the first place.
- Only claim a save succeeded when the result is `{ "success": true }`. Never hide from
  the user that history was saved, and never fabricate commands, files, or outcomes.
:::

The whole `.mono/` directory (including `.mono/skills/` staging and the clone) is
**gitignored** — nothing here is committed into the app repo (see the `.mono/` convention
in [Sync](../repo/sync)).

## When to save — and when not to

**Save** for meaningful work: code changes, bug investigations, architecture/DB/API
changes, business-rule clarifications, config/security changes, useful debugging
findings, reusable guidance (including failed work that produced insight).

**Don't save** greetings, empty or cancelled sessions, trivial typo fixes, or repeated
prompts with no new result.

---

See also: [Config](../repo/config) (the `skill` key next to the rest of `mono.config.ts`),
[Sync](../repo/sync) (how the `.mono/` folder is managed), [Environment](../repo/env)
(env vars), [Template Rules](./template) (the day-to-day AI contract), and
[Reference LLMs](./ref-llms).
