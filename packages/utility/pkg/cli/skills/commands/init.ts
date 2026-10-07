// pkg/cli/skills/commands/init.ts
import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { stagingRoot } from '../../../../src/skills/staging'
import { resolveAppId } from '../../../../src/skills/appid'
import type { SessionMetadata } from '../../../../src/skills/types'
import { fail, guardArgs, prelude, printJson } from '../_shared'

/** A session id usable as a folder name: `[a-z0-9._-]`, no traversal. */
function assertSessionId(id: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id) || id.includes('..')) {
    fail(`Invalid --session-id '${id}': use letters, digits, '.', '_' or '-' (e.g. gallery-image-lightbox).`)
  }
}

/**
 * `mono skills init --session-id <id>` — seed `.mono/skills/pending/<id>/` with
 * a skeleton that already passes validation, so a human can fill in
 * `summary.md` (and optionally `decisions.json` / `files-changed.json`) and run
 * `mono skills save`. Refuses to touch an existing directory. Local-only.
 */
export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Create a staged-session skeleton under .mono/skills/pending/<session-id>/ for manual editing.',
  },
  args: {
    app: { type: 'string', description: 'App id (defaults to the current app).' },
    'session-id': { type: 'string', description: 'Folder name + metadata.sessionId, e.g. fix-login-redirect.' },
  },
  async run({ args, rawArgs }) {
    guardArgs(rawArgs)
    const cwd = prelude()
    const sessionId = args['session-id']
    if (!sessionId) fail('--session-id is required (e.g. --session-id fix-login-redirect).')
    assertSessionId(sessionId)

    const app = resolveAppId({ app: args.app, cwd })
    const dir = path.join(stagingRoot(cwd), 'pending', sessionId)
    if (fs.existsSync(dir)) fail(`Staging directory already exists: ${dir}`)

    const now = new Date().toISOString()
    const metadata: SessionMetadata = {
      schemaVersion: 1,
      sessionId,
      status: 'completed',
      startedAt: now,
      finishedAt: now,
      title: '',
      topics: [],
      userRequests: [],
      commandsRun: [],
      validation: { testsRun: false, testsPassed: null, buildRun: false, buildPassed: null },
      outcome: { result: '', notes: '' },
    }
    const summary = [
      `# ${sessionId}`,
      '',
      '## What changed',
      '',
      '- ',
      '',
      '## Why',
      '',
      '- ',
      '',
      '## What the next session should know',
      '',
      '- ',
      '',
    ].join('\n')

    fs.mkdirSync(dir, { recursive: true })
    const files = {
      'metadata.json': JSON.stringify(metadata, null, 2) + '\n',
      'summary.md': summary,
      'decisions.json': JSON.stringify({ decisions: [] }, null, 2) + '\n',
      'files-changed.json': JSON.stringify({ files: [] }, null, 2) + '\n',
    }
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text)

    const rel = (path.relative(cwd, dir) || dir).split(path.sep).join('/')
    printJson({
      success: true,
      app,
      sessionId,
      dir,
      files: Object.keys(files),
      next: [
        `Edit ${rel}/summary.md (required) and ${rel}/metadata.json (title, topics, finishedAt).`,
        'Optionally fill decisions.json / files-changed.json, or delete them.',
        `mono skills save --dir ${rel} --dry-run`,
        `mono skills save --dir ${rel}`,
      ],
    })
    process.stderr.write(`\nStaged session skeleton created at ${dir}\n`)
  },
})
