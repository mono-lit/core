// src/skills/chunk.ts
//
// Split a JSON Lines conversation into upload-sized parts (spec §13, §17).
//
// Rules:
//   - Never split a line. Each part contains whole JSONL records.
//   - Aim for <= chunkSizeBytes per part (default 750 KB). A single line that is
//     itself larger than the limit becomes its own part (we can't split it).
//   - Parts are named `part-0001.jsonl`, `part-0002.jsonl`, ... (1-based).

import { SKILLS_DEFAULTS } from './config'

export interface ConversationPart {
  /** `part-0001.jsonl` */
  name: string
  /** The chunk's raw bytes (already newline-joined). */
  content: Buffer
}

/**
 * Chunk newline-delimited `jsonl` text into parts. Blank lines are dropped.
 * Returns `[]` for empty input.
 */
export function chunkConversation(
  jsonl: string,
  chunkSizeBytes: number = SKILLS_DEFAULTS.chunkSizeBytes,
): ConversationPart[] {
  const lines = jsonl.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []

  const parts: ConversationPart[] = []
  let current: string[] = []
  let currentBytes = 0

  const flush = () => {
    if (current.length === 0) return
    const name = `part-${String(parts.length + 1).padStart(4, '0')}.jsonl`
    // Trailing newline so concatenated parts stay valid JSONL.
    parts.push({ name, content: Buffer.from(current.join('\n') + '\n', 'utf8') })
    current = []
    currentBytes = 0
  }

  for (const line of lines) {
    const lineBytes = Buffer.byteLength(line, 'utf8') + 1 // +1 for the newline
    // If adding this line would overflow and we already have content, flush first.
    if (currentBytes > 0 && currentBytes + lineBytes > chunkSizeBytes) flush()
    current.push(line)
    currentBytes += lineBytes
  }
  flush()

  return parts
}
