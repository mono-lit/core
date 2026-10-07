#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const [sub, ...rest] = process.argv.slice(2)

const targets = {
  env: 'mono-env.mjs',
  sync: 'mono-clone.mjs',
  prepare: 'mono-prepare.js',
  skills: 'mono-skills.js',
  db: 'mono-db.js',
}

const target = targets[sub]

if (!target) {
  console.error('Usage: mono <command> [...args]')
  console.error('Commands:')
  console.error('  env       -e <file> [-a <app>] [-r <dir>] -- <cmd>   Load env, then run <cmd>')
  console.error('  sync      [--no-prune]                                Sync apps from mono.config into .mono/apps (an app removed from `apps[]` is deleted; --no-prune keeps it)')
  console.error('  prepare   [--cwd <dir>]                               Generate .mono/tsconfig.json and wire it into root tsconfig')
  console.error('  skills    <check|init|save|retry|read|search|sync|session|template|...>  MONO Skills: app knowledge + AI session history in the repo set as `skill` in mono.config.ts')
  console.error('  db        <validate|preview|export>                    Mock IndexedDB backend: validate schemas, preview seed data')
  process.exit(sub ? 1 : 0)
}

const result = spawnSync(process.execPath, [resolve(here, target), ...rest], {
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
