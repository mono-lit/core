// pkg/cli/skills/commands/template.ts
import { defineCommand } from 'citty'
import { guardArgs, printJson } from '../_shared'
import { SESSION_FILE_STANDARD } from '../standard'

/**
 * `mono skills template` — print the canonical staged-session file JSON standard
 * (schemas + examples). Pure reference: needs no config, no repo, no env.
 */
export const templateCommand = defineCommand({
  meta: {
    name: 'template',
    description: 'Print the canonical staged-session file JSON standard (schemas + examples).',
  },
  async run({ rawArgs }) {
    guardArgs(rawArgs)
    printJson({ success: true, standard: SESSION_FILE_STANDARD })
  },
})
