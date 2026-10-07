/**
 * Detail sheets: one worksheet per master row, reached from a link in the
 * master sheet.
 *
 * This file only RESOLVES the rows — turning each master row into the detail
 * rows that belong to it. Rendering stays in `excel/index.ts`, so this module
 * has no idea ExcelJS exists (the same invariant `excel/nodes.ts` keeps).
 *
 * Two sources, because a list screen has both shapes:
 *
 *   · `field` — the rows are already nested on the master row. No I/O, so the
 *     whole export stays as fast as a single-sheet one.
 *   · `load`  — the rows are fetched, for the far commoner case where a list
 *     endpoint does not embed its own lines.
 *
 * `load` is BATCHED, and that is the whole point of its shape. It receives a
 * chunk of master rows and their keys and returns the rows for all of them at
 * once, so a backend that can filter on a set of keys (`WHERE id IN (…)`, or
 * OData's `or` chain) serves a chunk per request. Loading per document instead
 * would put a 1000-row master at 1000 round-trips — the shape the prior art has,
 * and the reason its exports take minutes.
 *
 * The response comes back flat, so it is bucketed by `groupBy` (defaulting to
 * the master key's own name) to work out which rows belong to which document.
 */

import type { MonoExportDetail } from './types'

/** One document's resolved rows, plus the key that names its sheet. */
export interface ResolvedDetail {
  /** The master row it came from. */
  row: Record<string, unknown>
  /** The value of `detail.key` on that row, as a string. */
  key: string
  rows: unknown[]
}

/** A document that will get no sheet, and why. */
export interface SkippedDetail {
  key: string
  reason: 'empty' | 'failed'
  /** Present when `reason` is `failed`. */
  error?: unknown
}

export interface ResolveDetailResult {
  details: ResolvedDetail[]
  skipped: SkippedDetail[]
}

function readPath(row: Record<string, unknown>, path: string): unknown {
  if (path in row) return row[path]
  // Dotted paths, matching what the table's own `field` accessors accept.
  return path
    .split('.')
    .reduce<unknown>((acc, part) => (acc == null ? acc : (acc as never)[part]), row)
}

/**
 * Run `task` over `items` with at most `limit` in flight.
 *
 * Deliberately NOT `Promise.all` over the whole list. The implementation this
 * replaces fires every batch at once and wraps the lot in a single `.catch`, so
 * one flaky request loses a multi-minute export and discards the error with it.
 * Here a rejection is captured per item, and the rest of the workbook is still
 * produced.
 *
 * The items are CHUNKS of master rows, not single documents — see the note at
 * the top of this file.
 */
async function pool<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<Array<PromiseSettledResult<R>>> {
  const out: Array<PromiseSettledResult<R>> = new Array(items.length)
  let cursor = 0

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      try {
        out[index] = { status: 'fulfilled', value: await task(items[index]) }
      } catch (error) {
        out[index] = { status: 'rejected', reason: error }
      }
    }
  }

  const size = Math.max(1, Math.min(limit, items.length))
  await Promise.all(Array.from({ length: size }, worker))
  return out
}

/**
 * Turn master rows into per-document detail rows.
 *
 * A document with no rows is reported in `skipped` rather than given an empty
 * sheet — an empty worksheet behind a link is worse than no link, and the
 * caller gets told which documents those were instead of having to diff the
 * tab list.
 */
export async function resolveDetails(
  masterRows: unknown[],
  detail: MonoExportDetail,
): Promise<ResolveDetailResult> {
  const rows = masterRows.filter(
    (row): row is Record<string, unknown> => !!row && typeof row === 'object',
  )
  const keyOf = (row: Record<string, unknown>): string => String(readPath(row, detail.key) ?? '')

  const details: ResolvedDetail[] = []
  const skipped: SkippedDetail[] = []

  const collect = (row: Record<string, unknown>, value: unknown): void => {
    const key = keyOf(row)
    const list = Array.isArray(value) ? value : []
    if (!key || !list.length) {
      skipped.push({ key: key || '(no key)', reason: 'empty' })
      return
    }
    details.push({ row, key, rows: list })
  }

  if (typeof detail.load === 'function') {
    const size = Math.max(1, Math.floor(detail.loadChunk ?? 100))
    const chunks: Array<Record<string, unknown>[]> = []
    for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size))

    const groupBy = detail.groupBy ?? detail.key
    const groupOf =
      typeof groupBy === 'function'
        ? groupBy
        : (row: Record<string, unknown>): unknown => readPath(row, groupBy)

    const settled = await pool(chunks, detail.concurrency ?? 4, (chunk) =>
      Promise.resolve(
        detail.load!({
          data: chunk,
          keys: [...new Set(chunk.map((row) => readPath(row, detail.key)))],
          key: detail.key,
        }),
      ),
    )

    settled.forEach((result, index) => {
      const chunk = chunks[index]

      // A chunk is one request, so its failure takes every document in it.
      if (result.status === 'rejected') {
        for (const row of chunk) {
          skipped.push({ key: keyOf(row) || '(no key)', reason: 'failed', error: result.reason })
        }
        return
      }

      // Fan the flat response back out per document. Bucketing once beats
      // re-scanning the whole response for every row in the chunk.
      const byKey = new Map<string, unknown[]>()
      for (const row of Array.isArray(result.value) ? result.value : []) {
        if (!row || typeof row !== 'object') continue
        const key = String(groupOf(row as Record<string, unknown>) ?? '')
        if (!key) continue
        const bucket = byKey.get(key)
        if (bucket) bucket.push(row)
        else byKey.set(key, [row])
      }

      for (const row of chunk) collect(row, byKey.get(keyOf(row)) ?? [])
    })

    return { details, skipped }
  }

  if (detail.field) {
    for (const row of rows) collect(row, readPath(row, detail.field))
    return { details, skipped }
  }

  throw new Error('[mono-export] `detail` needs either `field` or `load`.')
}
