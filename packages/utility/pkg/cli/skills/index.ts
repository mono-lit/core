// pkg/cli/skills/index.ts
//
// `mono skills <command>` — the CLI shell for the MONO Skills workflow.
//
// WHAT THIS IS
//   A small, guard-railed gateway between an AI assistant (or a human) and the
//   app's knowledge/history repository — the one the user chose in
//   `mono.config.ts`:
//
//     skill: { url: 'https://github.com/org/repo.git', envToken: 'MY_TOKEN_ENV' }
//
//   The AI never talks to git/GitHub directly for this — it goes through these
//   subcommands.
//
// THE CONTRACT (enforced in code, not just docs)
//   - The repository comes from `skill` in mono.config.ts ONLY. No flag/arg/env
//     can retarget it (`ALLOWED_FLAGS` + `guardArgs`).
//   - The feature is OFF unless `skill` is present. When absent, every command
//     that touches the repo prints `{ skipped: true, reason:
//     "MONO_SKILLS_NOT_CONFIGURED" }` and does nothing. `check` always runs.
//   - Access is git-first: this machine's own credentials, then — only on a
//     no-access failure — the token named by `skill.envToken`. The token rides
//     the fetch/push URL only; it is NEVER printed, logged, stored, or argv'd.
//   - Only these flags are accepted anywhere: --app --dir --type --path --query
//     --limit --session-id --dry-run. Anything else is rejected.
//
// OUTPUT
//   Every command prints exactly one JSON object to stdout (for the AI to parse).
//   Human-facing report lines (e.g. the saved path) go to stderr.
//
// TYPICAL FLOW (AI)
//   1. mono skills check                      (verify config + access)
//   2. mono skills read --app <id> --type knowledge
//   3. ...do the real work...
//   4. stage .mono/skills/pending/<id>/ (metadata.json, summary.md, ...)
//   5. mono skills save --app <id> --dir .mono/skills/pending/<id> [--dry-run]
//   6. report the permanent repoPath on success; preserve staging on failure.
//
// MANUAL FLOW (human)
//   mono skills init --session-id <id>  ->  edit the files  ->  save --dry-run
//   ->  save  ->  (failed? fix, then retry)  ->  mono skills sync to browse.

import { defineCommand, runMain } from 'citty'
import { checkCommand } from './commands/check'
import { whoamiCommand } from './commands/whoami'
import { readCommand } from './commands/read'
import { searchCommand } from './commands/search'
import { saveCommand } from './commands/save'
import { retryCommand } from './commands/retry'
import { pendingCommand } from './commands/pending'
import { failedCommand } from './commands/failed'
import { sessionCommand } from './commands/session'
import { templateCommand } from './commands/template'
import { initCommand } from './commands/init'
import { syncCommand } from './commands/sync'

const main = defineCommand({
  meta: {
    name: 'skills',
    description:
      'MONO Skills: read app knowledge/skills and save AI session history to the git repository configured as `skill` in mono.config.ts. Off unless `skill` is set; git credentials first, `envToken` as fallback.',
  },
  subCommands: {
    check: checkCommand,
    whoami: whoamiCommand,
    init: initCommand,
    read: readCommand,
    search: searchCommand,
    save: saveCommand,
    retry: retryCommand,
    pending: pendingCommand,
    failed: failedCommand,
    session: sessionCommand,
    sync: syncCommand,
    template: templateCommand,
  },
})

runMain(main)
