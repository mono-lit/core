// pkg/cli/skills/commands/retry.ts
import { defineCommand } from 'citty'
import { runSave } from '../../../../src/skills/save'
import { resolveAppId } from '../../../../src/skills/appid'
import { connect, fail, guardArgs, prelude, printJson, requireSkillConfig, skipIfGenericApp } from '../_shared'
import { reportNotSaved, reportSaved } from './save'

/**
 * `mono skills retry` — re-save a previously failed session from
 * `.mono/skills/failed/<id>`. Same path as `save`; on success the local copy is
 * cleaned up, on failure it is preserved.
 */
export const retryCommand = defineCommand({
  meta: {
    name: 'retry',
    description: 'Retry saving a failed session from .mono/skills/failed/<session-id>.',
  },
  args: {
    app: { type: 'string', description: 'App id (defaults to the current app).' },
    dir: { type: 'string', description: 'Failed staging directory, e.g. .mono/skills/failed/<session-id>.' },
  },
  async run({ args, rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    const { target } = requireSkillConfig(cwd)

    const dir = args.dir
    if (!dir) fail('--dir is required (path to the failed session under .mono/skills/failed/).')

    // Same generic-name guard as save.
    skipIfGenericApp(resolveAppId({ app: args.app, cwd }))

    const { remote } = connect(cwd, target, 'always')
    try {
      const result = runSave({ cwd, app: args.app, dir, remote })
      printJson(result)
      reportSaved(result, remote)
    } catch (e: any) {
      reportNotSaved(e, target.remoteUrl, e?.sessionId)
    }
  },
})
