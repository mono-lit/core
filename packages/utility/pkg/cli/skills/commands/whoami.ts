// pkg/cli/skills/commands/whoami.ts
import { defineCommand } from 'citty'
import { detectActor } from '../../../../src/skills/actor'
import { guardArgs, prelude, printJson } from '../_shared'

/**
 * `mono skills whoami` — print the effective local git identity used for
 * attribution: `{ name, email, actorFolder }`. The identity is detected, never
 * supplied by the caller. Local-only, so it runs whether or not `skill` is set.
 */
export const whoamiCommand = defineCommand({
  meta: {
    name: 'whoami',
    description: 'Show the local git identity used for attribution (name, email, actorFolder).',
  },
  async run({ rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    printJson({ success: true, ...detectActor(cwd) })
  },
})
