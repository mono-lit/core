// pkg/cli/skills/commands/sync.ts
import { defineCommand } from 'citty'
import { redactUrl } from '../../../../src/skills/git'
import { connect, describeRemote, guardArgs, prelude, printJson, requireSkillConfig } from '../_shared'

/**
 * `mono skills sync` — fetch the configured repository into the local clone
 * (`.mono/skills/repo/`) right now, regardless of staleness. `read`/`search`
 * refresh on their own when stale; this is for a human who wants to browse the
 * clone, or to verify access end-to-end.
 */
export const syncCommand = defineCommand({
  meta: {
    name: 'sync',
    description: 'Refresh the local clone of the skills repository (.mono/skills/repo/) now.',
  },
  async run({ rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    const { target } = requireSkillConfig(cwd)
    const { remote, repo } = connect(cwd, target, 'always')
    printJson({
      success: true,
      repository: redactUrl(target.remoteUrl),
      ref: remote.ref,
      dir: remote.dir,
      transport: remote.transport,
      emptyRemote: remote.emptyRemote,
      headSha: repo.headSha,
      path: repo.repoDir,
      refreshed: repo.refreshed,
      stale: repo.stale,
    })
    process.stderr.write(
      `\nSkills repo ${repo.refreshed ? 'refreshed' : repo.stale ? 'NOT refreshed (serving the stale clone)' : 'up to date'}: ` +
        `${describeRemote(remote)}${repo.headSha ? ` @ ${repo.headSha.slice(0, 7)}` : ' (empty)'}\n${repo.repoDir}\n`,
    )
  },
})
