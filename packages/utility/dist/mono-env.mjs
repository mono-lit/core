#!/usr/bin/env node
// bin/mono-env.mjs
import { existsSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, isAbsolute, basename, relative, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import dotenv from 'dotenv'

const args = process.argv.slice(2)

const envFiles = []
const commandArgs = []

let appName = null
let appRoot = '.mono/apps'

function resolvePath(file) {
  return isAbsolute(file) ? file : resolve(process.cwd(), file)
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i]

  if (arg === '--') {
    commandArgs.push(...args.slice(i + 1))
    break
  }

  if (arg === '-e' || arg === '--env') {
    const file = args[i + 1]

    if (!file) {
      console.error('[mono-env] Missing value after -e / --env')
      process.exit(1)
    }

    envFiles.push(file)
    i++
    continue
  }

  if (arg === '-a' || arg === '--app') {
    const name = args[i + 1]

    if (!name) {
      console.error('[mono-env] Missing value after -a / --app')
      process.exit(1)
    }

    appName = name
    i++
    continue
  }

  if (arg === '-r' || arg === '--app-root') {
    const root = args[i + 1]

    if (!root) {
      console.error('[mono-env] Missing value after -r / --app-root')
      process.exit(1)
    }

    appRoot = root
    i++
    continue
  }

  /**
   * Supports:
   * node mono-env.mjs -e .env.dev vite
   */
  commandArgs.push(...args.slice(i))
  break
}

if (!envFiles.length) {
  console.warn('[mono-env] Warning: no env file provided. Example: -e .env.dev')
}

if (!commandArgs.length) {
  console.error('[mono-env] Missing command.')
  console.error('[mono-env] Example: node mono-env.mjs -e .env.dev -- vite')
  process.exit(1)
}

const childEnv = {
  ...process.env,
}

function loadEnvByPath(fullPath, displayPath, label) {
  if (!existsSync(fullPath)) {
    console.warn(`[mono-env] Warning: ${label} env file not found: ${displayPath}`)
    return
  }

  const result = dotenv.config({
    path: fullPath,
    override: true,
    processEnv: childEnv,
  })

  if (result.error) {
    console.warn(`[mono-env] Warning: failed to load ${label} env: ${displayPath}`)
    console.warn(result.error.message)
    return
  }

  console.log(`[mono-env] Loaded ${label} env: ${displayPath}`)
}

/**
 * Every federated app as `{ name, dir }`, the same answer every other command
 * gives: the `.mono/apps` clones PLUS every app read in place through
 * `apps[].path` (a mono-lith sibling), which a directory listing cannot see.
 *
 * The resolver lives in the built `config-node.js` next to this file in
 * `dist/`. Run from the repo's `bin/` (not built) or without a mono.config, it
 * falls back to listing the apps folder — exactly what this script always did.
 */
async function getAppRoots() {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    // A file URL, not a bare path: on Windows `import('C:\…')` is rejected as an unknown scheme.
    const { resolveFederatedRoots } = await import(pathToFileURL(resolve(here, 'config-node.js')).href)
    return resolveFederatedRoots({ dirname: process.cwd(), appsDir: appRoot })
      .map((r) => ({ name: r.name, dir: r.root }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (e) {
    // A declared `path` with no directory and no `url` is a config error every
    // command reports; do not paper over it with the directory listing.
    if (e instanceof Error && e.message.includes('does not exist and no url is declared')) {
      console.error(`[mono-env] ${e.message}`)
      process.exit(1)
    }
    return listAppsFolder()
  }
}

function listAppsFolder() {
  const fullAppRoot = resolve(process.cwd(), appRoot)

  if (!existsSync(fullAppRoot)) {
    console.warn(`[mono-env] Warning: app root folder not found: ${appRoot}`)
    return []
  }

  return readdirSync(fullAppRoot)
    .filter((name) => statSync(resolve(fullAppRoot, name)).isDirectory())
    .sort()
    .map((name) => ({ name, dir: resolve(fullAppRoot, name) }))
}

function loadRootEnv(file) {
  const fullPath = resolvePath(file)
  loadEnvByPath(fullPath, file, 'root')
}

function loadAppEnv(app) {
  if (!existsSync(app.dir)) {
    console.warn(`[mono-env] Warning: app folder not found: ${displayDir(app.dir)}`)
    return
  }

  for (const file of envFiles) {
    const envFileName = basename(file)
    const appEnvPath = resolve(app.dir, envFileName)
    const displayPath = `${displayDir(app.dir)}/${envFileName}`

    loadEnvByPath(appEnvPath, displayPath, `app:${app.name}`)
  }
}

function displayDir(dir) {
  const rel = relative(process.cwd(), dir)
  return (rel || dir).replace(/\\/g, '/')
}

/**
 * 1. Load root env first.
 *
 * Example:
 * .env.dev
 */
for (const file of envFiles) {
  loadRootEnv(file)
}

/**
 * 2. Load app env second.
 *
 * Default behavior:
 * - if -a sales is provided, only load that app (by name — a clone under
 *   .mono/apps or a sibling read through apps[].path)
 * - if no -a is provided, load every federated app
 */
const allApps = await getAppRoots()
const apps = appName
  ? [allApps.find((a) => a.name === appName) ?? { name: appName, dir: resolve(process.cwd(), appRoot, appName) }]
  : allApps
const appNames = apps.map((a) => a.name)

for (const app of apps) {
  loadAppEnv(app)
}

if (apps.length === 1) {
  childEnv.MONO_APP_NAME = apps[0].name
  childEnv.MONO_APP_DIR = apps[0].dir
}

if (appNames.length > 1) {
  childEnv.MONO_APP_NAMES = appNames.join(',')

  console.warn(
    '[mono-env] Warning: multiple app env files loaded. Duplicate keys will override each other. Use unique env names per app.',
  )
}

const command = commandArgs.join(' ')

console.log(`[mono-env] Apps: ${appNames.length ? appNames.join(', ') : '-'}`)
console.log(`[mono-env] Command: ${command}`)

const result = spawnSync(command, {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env: childEnv,
})

process.exit(result.status ?? 1)