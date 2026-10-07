// pkg/cli/skills/_shared.ts
//
// Helpers shared by every `mono skills` subcommand. This CLI is meant to be run
// by an AI (and by hand), so the conventions here matter:
//
//   - Output is JSON-FIRST: each command prints exactly one JSON object to
//     stdout, so the caller can parse the result deterministically.
//   - Failures print `{ success: false, error }` and exit non-zero.
//   - A token is NEVER printed, logged, or echoed in any path.
//   - A hard ARGUMENT GUARD rejects any flag outside the approved allowlist —
//     especially `--token` / `--url` / `--repo` / `--branch`, which could
//     retarget the repo or leak a token via argv. The repo comes from
//     `mono.config.ts` (`skill`) and nowhere else.

import {
  ALLOWED_FLAGS,
  isGenericAppName,
  loadSkillConfig,
  loadSkillsEnv,
  resolveSkillTarget,
  type MonoSkillConfig,
  type SkillTarget,
} from '../../../src/skills/config'
import {
  ensureRepo,
  resolveRemote,
  SkillsAccessError,
  type EnsureRepoResult,
  type RepoRefresh,
  type ResolvedRemote,
} from '../../../src/skills/repo'
import { redactUrl } from '../../../src/skills/git'
import type { SkippedResult } from '../../../src/skills/types'

/** Print a single JSON object to stdout (pretty, machine-parseable). */
export function printJson(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n')
}

/** Print a failure payload and exit 1. Use for every error exit. */
export function fail(error: string, extra: Record<string, unknown> = {}): never {
  printJson({ success: false, error: redactUrl(error), ...extra })
  process.exit(1)
}

/**
 * Reject any CLI flag that isn't in the approved allowlist. Scans the RAW args
 * so even flags citty would silently accept are caught. Call this first in
 * every command's `run`, passing `ctx.rawArgs`.
 */
export function guardArgs(rawArgs: string[]): void {
  for (const arg of rawArgs) {
    if (!arg.startsWith('--')) continue
    // `--flag=value` or `--flag`
    const name = arg.slice(2).split('=')[0]
    if (name === 'help' || name === 'version') continue
    if (!ALLOWED_FLAGS.includes(name)) {
      fail(
        `Disallowed flag '--${name}'. The mono skills CLI accepts only: ${ALLOWED_FLAGS.map((f) => '--' + f).join(', ')}. ` +
          `The repository target comes from \`skill\` in mono.config.ts and cannot be overridden.`,
      )
    }
  }
}

/** Load `.env` so `skill.envToken` can resolve, then return cwd. */
export function prelude(): string {
  const cwd = process.cwd()
  loadSkillsEnv(cwd)
  return cwd
}

/**
 * For commands that touch the repository: read `skill` from mono.config.ts.
 * Absent → print the skipped result (NOT an error) and exit 0. Present but
 * broken → fail. Returns the parsed config + target when the caller should
 * continue. `check` does NOT use this — it always runs and reports the state.
 */
export function requireSkillConfig(cwd: string): { cfg: MonoSkillConfig; target: SkillTarget } {
  let cfg: MonoSkillConfig | null
  try {
    cfg = loadSkillConfig(cwd)
  } catch (e: any) {
    return fail(e.message)
  }
  if (!cfg) {
    const skipped: SkippedResult = {
      success: true,
      skipped: true,
      reason: 'MONO_SKILLS_NOT_CONFIGURED',
      hint: 'Add `skill: { url, envToken? }` to mono.config.ts to enable the skills workflow.',
    }
    printJson(skipped)
    process.exit(0)
  }
  try {
    return { cfg, target: resolveSkillTarget(cfg) }
  } catch (e: any) {
    return fail(e.message)
  }
}

/**
 * Reach the repository (git first, token second) and make sure the local clone
 * exists / is fresh enough. Access failures become a JSON failure carrying the
 * classified cause; the message is already redacted.
 */
export function connect(
  cwd: string,
  target: SkillTarget,
  refresh: RepoRefresh,
): { remote: ResolvedRemote; repo: EnsureRepoResult } {
  let remote: ResolvedRemote
  try {
    remote = resolveRemote({ target })
  } catch (e: any) {
    if (e instanceof SkillsAccessError) {
      return fail(e.message, { kind: e.kind, why: e.why ?? null, transportTried: e.transportTried })
    }
    return fail(e.message)
  }
  try {
    return { remote, repo: ensureRepo({ cwd, remote, refresh }) }
  } catch (e: any) {
    return fail(e.message, { repository: redactUrl(target.remoteUrl) })
  }
}

/**
 * For `save` / `retry`: if the resolved app id is still a default/generic
 * template name, print a skipped result (NOT an error) and exit 0. This stops
 * session history from being filed under a placeholder app id — the user must
 * rename the app first (Template Rule 1). Other commands are unaffected.
 */
export function skipIfGenericApp(appId: string): void {
  if (isGenericAppName(appId)) {
    printJson({
      success: true,
      skipped: true,
      reason: 'MONO_SKILLS_GENERIC_APP_NAME',
      app: appId,
      hint:
        `App '${appId}' still uses a default template name, so skills are not generated. ` +
        `Rename the app in mono.config.ts (and package.json) to a project-specific name first — see Template Rule 1.`,
    })
    process.exit(0)
  }
}

/** `<repo>@<ref>[/<dir>]` for human-facing stderr lines. */
export function describeRemote(remote: ResolvedRemote): string {
  const base = `${redactUrl(remote.target.remoteUrl)}@${remote.ref}`
  return remote.dir ? `${base}/${remote.dir}` : base
}
