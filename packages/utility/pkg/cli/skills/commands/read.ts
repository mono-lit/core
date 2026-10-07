// pkg/cli/skills/commands/read.ts
import { defineCommand } from 'citty'
import { runRead } from '../../../../src/skills/read'
import { connect, fail, guardArgs, prelude, printJson, requireSkillConfig } from '../_shared'

/**
 * `mono skills read` — read centralized knowledge or skills for an app, or a
 * single safe file via `--path`, from the local clone (refreshed when stale).
 * Path traversal (`../`) is rejected.
 */
export const readCommand = defineCommand({
  meta: {
    name: 'read',
    description: 'Read centralized knowledge/skills for an app (--type), or one file (--path).',
  },
  args: {
    app: { type: 'string', description: 'App id (defaults to the current app).' },
    type: { type: 'string', description: "'knowledge' or 'skills'." },
    path: { type: 'string', description: 'A specific safe file under the app, e.g. knowledge/business-rules.md.' },
  },
  async run({ args, rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    const { target } = requireSkillConfig(cwd)
    const { remote } = connect(cwd, target, 'if-stale')
    try {
      const type = args.type === 'knowledge' || args.type === 'skills' ? args.type : undefined
      const result = runRead({ cwd, app: args.app, type, path: args.path, remote })
      printJson({ success: true, ...result })
    } catch (e: any) {
      fail(e.message)
    }
  },
})
