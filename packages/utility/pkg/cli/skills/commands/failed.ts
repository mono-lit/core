// pkg/cli/skills/commands/failed.ts
import { defineCommand } from 'citty'
import { listSessions } from '../../../../src/skills/staging'
import { resolveAppId } from '../../../../src/skills/appid'
import { guardArgs, prelude, printJson } from '../_shared'

/** `mono skills failed` — list sessions whose upload failed (kept for retry). Local-only. */
export const failedCommand = defineCommand({
  meta: { name: 'failed', description: 'List failed sessions in .mono/skills/failed/.' },
  args: { app: { type: 'string', description: 'App id (defaults to the current app).' } },
  async run({ args, rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    const app = resolveAppId({ app: args.app, cwd })
    printJson({ success: true, app, kind: 'failed', sessions: listSessions(cwd, 'failed') })
  },
})
