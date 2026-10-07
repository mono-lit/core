/**
 * Worksheet names, which Excel is fussier about than anything else in a
 * workbook — and every rule below is one it enforces by refusing to open the
 * file, not by degrading.
 *
 *   · at most 31 characters
 *   · none of `* ? : \ / [ ]`
 *   · cannot be empty
 *   · cannot start or end with an apostrophe
 *   · unique within the workbook, case-insensitively
 *
 * A name derived from user data — a document number like `TU/2026/001` — breaks
 * three of those at once, so nothing may reach `addWorksheet` unsanitised.
 */

/**
 * The characters Excel refuses outright.
 *
 * Note what is NOT in here: the space and the hyphen are both perfectly legal,
 * and stripping them would quietly rewrite a document number like `TP-001` into
 * `TP 001`, so the sheet name would no longer match what the master sheet shows.
 */
const FORBIDDEN = /[*?:\\/[\]]/g

/**
 * One name, made legal. Does NOT make it unique — that is
 * {@link SheetNames.take}'s job, because uniqueness needs the whole workbook.
 */
export function sanitizeSheetName(raw: unknown, fallback = 'Sheet'): string {
  const cleaned = String(raw ?? '')
    .replace(FORBIDDEN, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Excel rejects a leading or trailing apostrophe, because a reference to the
    // sheet quotes the name with exactly that character.
    .replace(/^'+|'+$/g, '')
    .trim()
    .slice(0, 31)
    // Slicing can re-expose a trailing apostrophe, so trim once more after it.
    .replace(/'+$/, '')
    .trim()

  return cleaned || fallback
}

/**
 * Escape a name for use inside a reference like `#'Sheet'!A1`.
 *
 * The name is single-quoted there, so a literal apostrophe has to be doubled.
 * {@link sanitizeSheetName} only strips apostrophes at the ends — one in the
 * middle (`Bob's Data`) is legal and has to survive.
 */
export function escapeSheetRef(name: string): string {
  return name.replace(/'/g, "''")
}

/** A reference to `A1` of `name`, ready to use as a hyperlink target. */
export function sheetRef(name: string, cell = 'A1'): string {
  return `#'${escapeSheetRef(name)}'!${cell}`
}

/**
 * The workbook's name registry.
 *
 * Deliberately the ONLY place a name is claimed. The implementation this feature
 * is modelled on reserves a name up front and then dedupes a second time inside
 * its writer against the same set — so the second call always collides with the
 * reservation it just made, and every sheet in that workbook ends up suffixed
 * ` (2)`. One registry, one `take()`, no second opinion.
 */
export class SheetNames {
  /** Lower-cased claimed names: Excel's uniqueness is case-insensitive. */
  private readonly used = new Set<string>()

  constructor(existing: Iterable<string> = []) {
    for (const name of existing) this.used.add(name.toLowerCase())
  }

  /** Claim a legal, unique name derived from `raw`. */
  take(raw: unknown, fallback = 'Sheet'): string {
    const base = sanitizeSheetName(raw, fallback)
    if (!this.used.has(base.toLowerCase())) {
      this.used.add(base.toLowerCase())
      return base
    }

    for (let n = 2; n < 10000; n += 1) {
      const suffix = ` (${n})`
      // Truncate the STEM, never the suffix — the suffix is the only reason the
      // name is unique at all.
      const candidate = `${base.slice(0, 31 - suffix.length).trim()}${suffix}`
      if (!this.used.has(candidate.toLowerCase())) {
        this.used.add(candidate.toLowerCase())
        return candidate
      }
    }

    // 9998 collisions on one stem. Nothing sane reaches here; take something
    // guaranteed free rather than looping forever or handing back a duplicate.
    const last = `${base.slice(0, 20)} ${Date.now().toString(36)}`.slice(0, 31)
    this.used.add(last.toLowerCase())
    return last
  }
}
