// pkg/cli/skills/commands/check.ts
import { defineCommand } from 'citty'
import { runCheck } from '../../../../src/skills/check'
import { fail, guardArgs, prelude, printJson } from '../_shared'

/**
 * `mono skills check` — diagnostic. Always runs (even when `skill` is not
 * configured) so it can report the state. Never prints a token.
 */
export const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description:
      'Verify MONO Skills setup: `skill` config, repository access (git credentials, then envToken), branch/folder, push permission, local clone, and git identity. Never prints a token.',
  },
  async run({ rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    try {
      printJson({ success: true, ...runCheck({ cwd }) })
    } catch (e: any) {
      fail(e.message)
    }
  },
})
