// src/skills/save.ts
//
// Orchestrates `mono skills save` / `retry`. Pipeline:
//
//   validate staging -> build the upload plan (augment + redact + chunk) ->
//   compute the IMMUTABLE permanent path -> (dry-run stops here) ->
//   resolve the remote (git first, token second) -> refresh the clone ->
//   write files + create-once app.json / user.json + refuse to overwrite ->
//   ONE commit -> push (replayed on a fresh tip if someone pushed first) ->
//   cleanup local (success) or move to failed/ (failure).
//
// The permanent layout, under `skill.url`'s folder (`dir`, default the root):
//   <app>/app.json
//   <app>/history/<actorFolder>/user.json
//   <app>/history/<actorFolder>/YYYY-MM-DD/HH-mm-ss_<sessionId>/
//       metadata.json summary.md index.json files-changed.json decisions.json
//       conversation/part-0001.jsonl ...

import fs from 'node:fs'
import path from 'node:path'
import { SKILLS_DEFAULTS, loadSkillConfig, resolveSkillTarget, type SkillTarget } from './config'
import { commitAndPush, ensureRepo, resolveRemote, skillsRoot, type ResolvedRemote } from './repo'
import { detectActor } from './actor'
import { resolveAppId } from './appid'
import { loadStagedSession, moveToFailed, removeSession } from './staging'
import { redact } from './redact'
import { chunkConversation } from './chunk'
import type { GitRunner } from './git'
import type { Actor, SaveResult } from './types'

/** A single file to write into the permanent session folder. */
interface PlannedFile {
  /** Path relative to the skills root (`dir`). */
  repoPath: string
  /** Already-redacted bytes. */
  content: Buffer
}

/** Two-digit zero pad. */
const p2 = (n: number) => String(n).padStart(2, '0')

/** `YYYY-MM-DD` + `HH-mm-ss` in LOCAL time from a Date. */
function dateParts(d: Date): { date: string; time: string } {
  return {
    date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
    time: `${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`,
  }
}

export interface SavePlan {
  appId: string
  actor: Actor
  sessionId: string
  /** The configured repository (plain URL). */
  repository: string
  /** `<app>/history/<actor>/<date>/<time>_<id>` */
  savedPath: string
  /** Files that WILL be written (skills-root-relative), in order. */
  files: PlannedFile[]
}

function readIfExists(dir: string, name: string): string | null {
  const f = path.join(dir, name)
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null
}

/** `skill` from mono.config.ts, or a clear error when it is absent. */
function requireTarget(cwd: string, target?: SkillTarget): SkillTarget {
  if (target) return target
  const cfg = loadSkillConfig(cwd)
  if (!cfg) throw new Error('`skill` is not configured in mono.config.ts')
  return resolveSkillTarget(cfg)
}

/**
 * Build the full upload plan from a staged session WITHOUT touching the network.
 * `--dry-run` returns exactly this. Everything textual is redacted here.
 */
export function buildSavePlan({
  cwd = process.cwd(),
  app,
  dir,
  target,
}: {
  cwd?: string
  app?: string
  dir: string
  target?: SkillTarget
}): SavePlan {
  const resolvedTarget = requireTarget(cwd, target)
  const appId = resolveAppId({ app, cwd })
  const actor = detectActor(cwd)
  const session = loadStagedSession(dir)
  const sessionId = session.sessionId

  // Permanent destination time: prefer the recorded finish time, else now.
  const when = session.metadata.finishedAt ? new Date(session.metadata.finishedAt) : new Date()
  const safeWhen = isNaN(when.getTime()) ? new Date() : when
  const { date, time } = dateParts(safeWhen)
  const sessionFolder = `${time}_${sessionId}`
  const savedPath = `${appId}/history/${actor.actorFolder}/${date}/${sessionFolder}`

  const files: PlannedFile[] = []
  const uploadedNames: string[] = []
  const put = (repoRel: string, text: string) => {
    files.push({ repoPath: `${savedPath}/${repoRel}`, content: Buffer.from(redact(text), 'utf8') })
    uploadedNames.push(repoRel)
  }

  // 1. metadata.json — augmented by the CLI then redacted.
  const augmented = {
    ...session.metadata,
    app: appId,
    actor: { name: actor.name, email: actor.email },
    actorFolder: actor.actorFolder,
    repository: resolvedTarget.remoteUrl,
    savedPath,
    uploadedAt: new Date().toISOString(),
  }
  put('metadata.json', JSON.stringify(augmented, null, 2))

  // 2. summary.md (required — validated by loadStagedSession).
  put('summary.md', readIfExists(session.dir, 'summary.md') ?? '')

  // 3. optional sidecars, included only when present.
  for (const opt of ['files-changed.json', 'decisions.json']) {
    const text = readIfExists(session.dir, opt)
    if (text != null) put(opt, text)
  }

  // 4. conversation.jsonl -> redacted, chunked into conversation/part-NNNN.jsonl.
  const convo = readIfExists(session.dir, 'conversation.jsonl')
  if (convo != null) {
    const parts = chunkConversation(redact(convo), SKILLS_DEFAULTS.chunkSizeBytes)
    for (const part of parts) {
      files.push({ repoPath: `${savedPath}/conversation/${part.name}`, content: part.content })
      uploadedNames.push(`conversation/${part.name}`)
    }
  }

  // 5. index.json — regenerated to list exactly what we upload.
  const index = {
    schemaVersion: 1,
    sessionId,
    format: 'jsonl',
    files: uploadedNames,
  }
  files.push({
    repoPath: `${savedPath}/index.json`,
    content: Buffer.from(JSON.stringify(index, null, 2), 'utf8'),
  })

  return { appId, actor, sessionId, repository: resolvedTarget.remoteUrl, savedPath, files }
}

function writeFileEnsured(file: string, content: Buffer | string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

/**
 * Write the plan into the clone. Runs inside `commitAndPush`, so it may run
 * more than once (after a replay onto a newer tip) — every step is idempotent:
 * `app.json` / `user.json` are created once and never overwritten (so human
 * edits to them survive), and an existing session folder is REFUSED (sessions
 * are immutable).
 */
export function applyPlan(plan: SavePlan, root: string): void {
  if (fs.existsSync(path.join(root, plan.savedPath, 'metadata.json'))) {
    throw new Error(`Refusing to overwrite an existing session at ${plan.savedPath}`)
  }

  const appJson = path.join(root, plan.appId, 'app.json')
  if (!fs.existsSync(appJson)) {
    writeFileEnsured(
      appJson,
      JSON.stringify({ schemaVersion: 1, app: plan.appId, createdAt: new Date().toISOString() }, null, 2) + '\n',
    )
  }
  const userJson = path.join(root, plan.appId, 'history', plan.actor.actorFolder, 'user.json')
  if (!fs.existsSync(userJson)) {
    writeFileEnsured(
      userJson,
      JSON.stringify(
        { name: plan.actor.name, email: plan.actor.email, actorFolder: plan.actor.actorFolder },
        null,
        2,
      ) + '\n',
    )
  }

  for (const file of plan.files) {
    writeFileEnsured(path.join(root, file.repoPath), file.content)
  }
}

/**
 * Execute a save: resolve the remote, refresh the clone, apply, commit, push.
 * On any failure the local staging dir is preserved / moved to `failed/` and
 * the error is rethrown (already redacted).
 */
export function runSave({
  cwd = process.cwd(),
  app,
  dir,
  target,
  remote,
  env = process.env,
  run,
}: {
  cwd?: string
  app?: string
  dir: string
  /** Pre-parsed `skill` (the CLI parses it once). */
  target?: SkillTarget
  /** Pre-resolved remote (skips the probe). */
  remote?: ResolvedRemote
  env?: NodeJS.ProcessEnv
  run?: GitRunner
}): SaveResult {
  const resolvedTarget = requireTarget(cwd, target ?? remote?.target)
  const plan = buildSavePlan({ cwd, app, dir, target: resolvedTarget })

  try {
    const resolved = remote ?? resolveRemote({ target: resolvedTarget, env, run })
    const repo = ensureRepo({ cwd, remote: resolved, refresh: 'always', run })
    const root = skillsRoot(repo.repoDir, resolved.dir)

    const pushed = commitAndPush({
      repoDir: repo.repoDir,
      remote: resolved,
      actor: plan.actor,
      message: `feat(${plan.appId}): session ${plan.sessionId}`,
      apply: () => applyPlan(plan, root),
      run,
    })

    // Success → clean up local staging (default behaviour).
    if (SKILLS_DEFAULTS.cleanupAfterSuccess) removeSession(dir)

    return {
      success: true,
      sessionId: plan.sessionId,
      repository: resolvedTarget.remoteUrl,
      ref: resolved.ref,
      dir: resolved.dir,
      transport: resolved.transport,
      savedPath: plan.savedPath,
      repoPath: resolved.dir ? `${resolved.dir}/${plan.savedPath}` : plan.savedPath,
      commit: pushed.sha,
      pushAttempts: pushed.attempts,
      filesUploaded: plan.files.length,
      localCleanup: SKILLS_DEFAULTS.cleanupAfterSuccess,
    }
  } catch (e) {
    // Preserve the session for retry; move pending -> failed when applicable.
    if (SKILLS_DEFAULTS.moveFailedSessions) {
      try {
        moveToFailed(cwd, plan.sessionId)
      } catch {
        /* leave it in place if the move fails */
      }
    }
    // Let the CLI name the preserved folder without re-parsing the staging dir.
    if (e && typeof e === 'object') (e as any).sessionId = plan.sessionId
    throw e
  }
}
