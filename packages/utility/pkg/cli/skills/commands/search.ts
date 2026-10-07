// pkg/cli/skills/commands/search.ts
import { defineCommand } from 'citty'
import { runSearch } from '../../../../src/skills/read'
import { connect, fail, guardArgs, prelude, printJson, requireSkillConfig } from '../_shared'

/**
 * `mono skills search` — find relevant knowledge/skills/history for a query in
 * the local clone. Returns ranked snippets; never bulk-loads all conversations.
 */
export const searchCommand = defineCommand({
  meta: {
    name: 'search',
    description: "Search an app's knowledge, skills, and history summaries for relevant matches.",
  },
  args: {
    app: { type: 'string', description: 'App id (defaults to the current app).' },
    query: { type: 'string', description: 'Search text.' },
    limit: { type: 'string', description: 'Max results (default 10).' },
  },
  async run({ args, rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    if (!args.query) fail('--query is required.')
    const { target } = requireSkillConfig(cwd)
    const { remote } = connect(cwd, target, 'if-stale')
    const limit = args.limit ? Math.max(1, parseInt(args.limit, 10) || 10) : 10
    try {
      const result = runSearch({ cwd, app: args.app, query: args.query, limit, remote })
      printJson({ success: true, ...result })
    } catch (e: any) {
      fail(e.message)
    }
  },
})
