// pkg/cli/skills/commands/save.ts
import { defineCommand } from 'citty'
import { buildSavePlan, runSave } from '../../../../src/skills/save'
import { resolveAppId } from '../../../../src/skills/appid'
import { redactUrl } from '../../../../src/skills/git'
import type { SaveResult } from '../../../../src/skills/types'
import type { ResolvedRemote } from '../../../../src/skills/repo'
import {
  connect,
  describeRemote,
  fail,
  guardArgs,
  prelude,
  printJson,
  requireSkillConfig,
  skipIfGenericApp,
} from '../_shared'

/** Human-facing report on stderr so stdout stays pure JSON. Shared with `retry`. */
export function reportSaved(result: SaveResult, remote: ResolvedRemote): void {
  process.stderr.write(
    `\nSession history saved to ${describeRemote(remote)}:\n\n${result.repoPath}\n` +
      (result.pushAttempts > 1 ? `(replayed after a concurrent save — ${result.pushAttempts} attempts)\n` : ''),
  )
}

/** Failure report for `save`/`retry`: JSON to stdout, one honest line to stderr, exit 1. */
export function reportNotSaved(e: any, repository: string, sessionId?: string): never {
  printJson({ success: false, error: redactUrl(e.message), repository: redactUrl(repository) })
  process.stderr.write(
    `\nSession history was NOT saved to ${redactUrl(repository)}.\n` +
      `Local staging data was preserved${sessionId ? ` under .mono/skills/failed/${sessionId}` : ''} — fix the cause and run \`mono skills retry\`.\n`,
  )
  process.exit(1)
}

/**
 * `mono skills save` — the primary command. Commits a completed, staged session
 * to the repository configured in `skill` (one commit, pushed). With `--dry-run`
 * it validates + redacts + reports the planned immutable path WITHOUT touching
 * the network. On failure the local staging directory is preserved (moved to
 * `failed/`) and the error is reported honestly.
 */
export const saveCommand = defineCommand({
  meta: {
    name: 'save',
    description:
      'Save a staged session (from .mono/skills/pending/<id>) to the configured skills repository. Use --dry-run to validate without pushing.',
  },
  args: {
    app: { type: 'string', description: 'App id (defaults to the current app).' },
    dir: { type: 'string', description: 'Staging directory, e.g. .mono/skills/pending/<session-id>.' },
    'dry-run': { type: 'boolean', description: 'Validate and report the planned path without pushing.' },
  },
  async run({ args, rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    const { target } = requireSkillConfig(cwd)

    const dir = args.dir
    if (!dir) fail('--dir is required (path to the staged session under .mono/skills/pending/).')
    const app = args.app

    // Don't generate history for an app still using a default/generic name.
    skipIfGenericApp(resolveAppId({ app, cwd }))

    // Dry run: offline plan only — no probe, no clone.
    if (args['dry-run']) {
      try {
        const plan = buildSavePlan({ cwd, app, dir, target })
        printJson({
          success: true,
          dryRun: true,
          repository: redactUrl(plan.repository),
          appId: plan.appId,
          sessionId: plan.sessionId,
          savedPath: plan.savedPath,
          filesPlanned: plan.files.length,
          files: plan.files.map((f) => f.repoPath),
        })
      } catch (e: any) {
        fail(e.message)
      }
      return
    }

    // Real save: reach the repo first so an access problem is reported as such.
    const { remote } = connect(cwd, target, 'always')
    try {
      const result = runSave({ cwd, app, dir, remote })
      printJson(result)
      reportSaved(result, remote)
    } catch (e: any) {
      reportNotSaved(e, target.remoteUrl, e?.sessionId)
    }
  },
})
