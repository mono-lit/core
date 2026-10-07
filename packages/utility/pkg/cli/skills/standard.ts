// pkg/cli/skills/standard.ts
//
// The canonical staged-session file JSON standard, in one place. This is the
// single source of truth printed by `mono skills template`, so an AI assistant
// can learn the exact on-disk shapes before staging a session.
//
// The examples are TYPED against the real interfaces in src/skills/types.ts, so
// if those shapes ever drift the build (tsdown `dts: true`) fails here — keeping
// this reference honest instead of letting it rot.

import type { SessionMetadata, SessionDecision, ChangedFile } from '../../../src/skills/types'

/** Example `metadata.json` (required). Typed, so it can't drift from `SessionMetadata`. */
const METADATA_EXAMPLE: SessionMetadata = {
  schemaVersion: 1,
  sessionId: 'gallery-image-lightbox',
  status: 'completed',
  startedAt: '2026-07-02T15:40:00.000Z',
  finishedAt: '2026-07-02T15:53:00.000Z',
  title: 'gallery-apps: image-only lightbox on the Picsum gallery',
  topics: ['image lightbox', 'gallery', 'Picsum'],
  userRequests: ['Clicking a thumbnail should open an image-only popup…'],
  commandsRun: ['mono skills check', 'npx vue-tsc --noEmit', 'npm run dev'],
  validation: { testsRun: false, testsPassed: null, buildRun: true, buildPassed: true },
  outcome: { result: 'shipped', notes: 'Added GalleryLightbox.vue; vue-tsc clean.' },
}

/** Example `files-changed.json` (optional). The reader also honours an optional `note` per file. */
const FILES_CHANGED_EXAMPLE: { files: ChangedFile[] } = {
  files: [
    { path: 'src/components/GalleryLightbox.vue', operation: 'added' },
    { path: 'src/pages/gallery/index.vue', operation: 'modified' },
  ],
}

/** Example `decisions.json` (optional). */
const DECISIONS_EXAMPLE: { decisions: SessionDecision[] } = {
  decisions: [
    {
      title: 'Custom Teleport lightbox over mono-modal',
      decision: 'Built a custom Teleport overlay component instead of reusing mono-modal.',
      reason: 'mono-modal always renders a padded card; the design needed an edge-to-edge image-only view.',
    },
  ],
}

/**
 * The canonical staged-session file standard. Frozen so callers can print it but
 * never mutate it. Mirrors the narrative reference in the VitePress docs
 * (`docs/ai/skills.md` → "Session file formats").
 */
export const SESSION_FILE_STANDARD = Object.freeze({
  version: 1,
  layout: '<app>/history/<actor>/YYYY-MM-DD/HH-mm-ss_<sessionId>/',
  stagingDir: '.mono/skills/pending/<id>/',
  required: ['metadata.json', 'summary.md'],
  files: {
    'metadata.json': {
      required: true,
      description:
        'Session metadata. `finishedAt` drives the destination HH-mm-ss (local time), else save time. ' +
        'The uploaded copy is augmented by the CLI (see `generated.metadataAugmentedWith`).',
      fields: [
        'schemaVersion: number',
        'sessionId: string',
        'status: "completed" | "partial" | "failed"',
        'startedAt?: string (ISO 8601)',
        'finishedAt?: string (ISO 8601)',
        'topics?: string[]',
        'userRequests?: string[]',
        'commandsRun?: string[]',
        'validation?: { testsRun?, testsPassed?, buildRun?, buildPassed? }',
        'outcome?: { result?: string, notes?: string }',
        'title?: string (read by the history browser)',
      ],
      example: METADATA_EXAMPLE,
    },
    'summary.md': {
      required: true,
      description: 'A concise, reusable "what changed and why" — the highest-value artifact for the next session.',
      format: 'markdown',
    },
    'files-changed.json': {
      required: false,
      description:
        'Path + operation metadata only (never file contents). Wrapper object `{ files: [...] }`; ' +
        'operation ∈ added | modified | deleted | renamed; an optional `note` per file is honoured by the reader.',
      example: FILES_CHANGED_EXAMPLE,
    },
    'decisions.json': {
      required: false,
      description: 'Technical/business decisions. Wrapper object `{ decisions: [...] }`; element `{ title, decision, reason }`.',
      example: DECISIONS_EXAMPLE,
    },
    'conversation.jsonl': {
      required: false,
      description:
        'One JSON object per line (user / assistant / tool). Stage a single file; the CLI redacts secrets and ' +
        'chunks it into conversation/part-0001.jsonl, part-0002.jsonl, … (≤ 750 KB per part, never splitting a line). Do not pre-chunk.',
    },
  },
  generated: {
    description: 'Written by the CLI — never stage these.',
    'index.json': {
      example: {
        schemaVersion: 1,
        sessionId: 'gallery-image-lightbox',
        format: 'jsonl',
        files: ['metadata.json', 'summary.md', 'files-changed.json', 'decisions.json'],
      },
    },
    'app.json': {
      example: { schemaVersion: 1, app: '<appId>', createdAt: '<ISO>' },
    },
    'user.json': {
      example: { name: '<git user.name>', email: '<git user.email>', actorFolder: '<slug>__<6-hex>' },
    },
    metadataAugmentedWith: ['app', 'actor', 'actorFolder', 'repository', 'savedPath', 'uploadedAt'],
  },
  notes: [
    'Only metadata.json + summary.md are required; the sidecars are optional. `mono skills init --session-id <id>` writes a skeleton that already passes validation.',
    'save/retry validate every staged file against this standard BEFORE committing — a mismatch (bad status, wrong decisions/files-changed shape, invalid conversation line) fails in the CLI and nothing is pushed. --dry-run runs the same checks.',
    'The destination is the git repository configured as `skill` in mono.config.ts (optionally a branch + subfolder via a GitHub /tree/<ref>/<dir> URL). The layout above sits under that folder.',
    'One session = ONE git commit (`feat(<app>): session <id>`), pushed to the configured branch. A concurrent save by someone else is handled by replaying onto their tip — the folder-per-user/session layout can never conflict.',
    'finishedAt drives the destination HH-mm-ss (local time), else save time.',
    'Saves are immutable — a save refuses to overwrite an existing session folder.',
    'The uploaded metadata.json `repository` field is the plain configured URL — never a token.',
    'The date and time_session are two separate path segments; GitHub collapses single-child date folders in its tree view (cosmetic, not a merged folder).',
  ],
})
