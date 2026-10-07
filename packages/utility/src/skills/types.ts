// src/skills/types.ts
//
// Shared TypeScript shapes for the `mono skills` workflow. These mirror the
// on-disk staging files and the CLI result payloads.

/** Outcome status a session can carry. */
export type SessionStatus = 'completed' | 'partial' | 'failed'

/** A file the session touched — METADATA ONLY; contents are never uploaded. */
export interface ChangedFile {
  path: string
  operation: 'added' | 'modified' | 'deleted' | 'renamed'
}

/** A technical/business decision recorded during the session. */
export interface SessionDecision {
  title: string
  decision: string
  reason?: string
}

/** Shape of `metadata.json` the AI (or a human) writes before `mono skills save`. */
export interface SessionMetadata {
  schemaVersion: number
  sessionId: string
  status: SessionStatus
  startedAt?: string
  finishedAt?: string
  topics?: string[]
  userRequests?: string[]
  commandsRun?: string[]
  validation?: {
    testsRun?: boolean
    testsPassed?: boolean | null
    buildRun?: boolean
    buildPassed?: boolean | null
  }
  outcome?: {
    result?: string
    notes?: string
  }
  // The CLI augments the uploaded copy with app/actor/repo/destination metadata.
  [key: string]: unknown
}

/** The effective local git identity used for attribution (`whoami`). */
export interface Actor {
  name: string
  email: string
  /** `<name-slug>__<6 hex>` — the per-actor folder under `<app>/history/`. */
  actorFolder: string
}

/** Result of a successful `mono skills save` / `retry`. */
export interface SaveResult {
  success: true
  sessionId: string
  /** The configured repository (plain URL, never a token). */
  repository: string
  /** Branch the session was pushed to. */
  ref: string
  /** Subfolder inside the repo (`''` = root). */
  dir: string
  /** Which credentials got through: the machine's own git access, or `envToken`. */
  transport: 'git' | 'token'
  /** `<app>/history/<actor>/<date>/<time>_<id>` — relative to `dir`. */
  savedPath: string
  /** `dir` + `savedPath` — the path as seen from the repository root. */
  repoPath: string
  /** The commit that landed on the remote. */
  commit: string
  /** 1 = first push; 2+ = replayed after a concurrent save. */
  pushAttempts: number
  filesUploaded: number
  localCleanup: boolean
}

/** Result when `skill` is not configured in mono.config.ts — NOT an error. */
export interface SkippedResult {
  success: true
  skipped: true
  reason: 'MONO_SKILLS_NOT_CONFIGURED'
  hint?: string
}

/** Generic failure payload. */
export interface FailureResult {
  success: false
  error: string
  [key: string]: unknown
}
