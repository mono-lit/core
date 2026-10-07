// pkg/cli/skills/commands/session.ts
import { defineCommand } from 'citty'
import { runSessionShow } from '../../../../src/skills/session'
import { connect, fail, guardArgs, prelude, printJson, requireSkillConfig } from '../_shared'

/** `mono skills session show --app <id> --session-id <id>` */
const showCommand = defineCommand({
  meta: { name: 'show', description: "Show a saved session's metadata + summary (no conversation)." },
  args: {
    app: { type: 'string', description: 'App id (defaults to the current app).' },
    'session-id': { type: 'string', description: 'The session id to display.' },
  },
  async run({ args, rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    const sessionId = args['session-id']
    if (!sessionId) fail('--session-id is required.')
    const { target } = requireSkillConfig(cwd)
    const { remote } = connect(cwd, target, 'if-stale')
    try {
      const result = runSessionShow({ cwd, app: args.app, sessionId, remote })
      printJson({ success: true, ...result })
    } catch (e: any) {
      fail(e.message)
    }
  },
})

/** `mono skills session <subcommand>` — currently just `show`. */
export const sessionCommand = defineCommand({
  meta: { name: 'session', description: 'Inspect saved sessions.' },
  subCommands: { show: showCommand },
})
