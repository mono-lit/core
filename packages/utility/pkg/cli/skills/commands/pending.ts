// pkg/cli/skills/commands/pending.ts
import { defineCommand } from 'citty'
import { listSessions } from '../../../../src/skills/staging'
import { resolveAppId } from '../../../../src/skills/appid'
import { guardArgs, prelude, printJson } from '../_shared'

/** `mono skills pending` — list locally-staged sessions awaiting upload. Local-only. */
export const pendingCommand = defineCommand({
  meta: { name: 'pending', description: 'List staged sessions in .mono/skills/pending/.' },
  args: { app: { type: 'string', description: 'App id (defaults to the current app).' } },
  async run({ args, rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    const app = resolveAppId({ app: args.app, cwd })
    printJson({ success: true, app, kind: 'pending', sessions: listSessions(cwd, 'pending') })
  },
})
