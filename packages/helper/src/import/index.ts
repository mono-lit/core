/**
 * `@mono-lit/helper` table import — read an edited spreadsheet back into the grid.
 *
 * The pipeline: parse the sheet (or the pasted text) into headers + rows, pair
 * each sheet row with a table row by composite key, coerce the declared columns,
 * and stage the differences. Nothing touches the underlying data — the result
 * lands in the grid's pending-changes buffer, to be reviewed and then saved or
 * discarded.
 *
 * @example
 * const result = await table.import({
 *   type: 'excel',
 *   data: file,
 *   match: [{ excel: 'Brand', field: 'BrandNama' }, { excel: 'CH.', field: 'Channel' }],
 *   columns: [{ excel: 'JAN', field: 'Jan', type: 'number' }],
 * })
 * if (!result.ok) warn(`${result.unmatched} rows didn't match`)
 */

import { coerceValue, isSameValue, normalizeHeader } from './coerce'
import { createMatcher, findMatch } from './match'
import { parseSheet } from './parse'
import type {
  MonoImportAmbiguity,
  MonoImportChange,
  MonoImportColumn,
  MonoImportOptions,
  MonoImportRejection,
  MonoImportResult,
} from './types'

export type {
  MonoImportAmbiguity,
  MonoImportChange,
  MonoImportColumn,
  MonoImportMatch,
  MonoImportNumberFormat,
  MonoImportOptions,
  MonoImportRejection,
  MonoImportResult,
  MonoImportType,
  MonoImportValueType,
} from './types'

/** What the controller supplies so this module never reaches into it. */
export interface TableImportBridge<T = any> {
  /** Every row the grid can produce — the default match target. */
  getData: () => Promise<T[]>
  /** The controller's stable string key for a row. */
  rowKeyOf: (row: T, index: number) => string
  /** The row's `keyExpr` value, for a later store update. */
  serverKeyOf: (row: T) => unknown
  /** Write the patches into the staged buffer, marking them as imported. */
  stageImported: (changes: Array<MonoImportChange<T>>) => void
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Build header → column-index, including any declared aliases. */
function buildHeaderIndex(
  headers: string[],
  aliases: Record<string, string[]> | undefined,
): Map<string, number> {
  const index = new Map<string, number>()
  headers.forEach((h, i) => {
    const key = normalizeHeader(h)
    // First occurrence wins: a duplicated header is almost always a stray
    // trailing column, and the leftmost is the real one.
    if (key && !index.has(key)) index.set(key, i)
  })

  if (aliases) {
    for (const [canonical, alts] of Object.entries(aliases)) {
      const target = normalizeHeader(canonical)
      if (index.has(target)) continue
      for (const alt of alts) {
        const found = index.get(normalizeHeader(alt))
        if (found !== undefined) {
          index.set(target, found)
          break
        }
      }
    }
  }

  return index
}

/** Read the sheet's raw grid into `{ header: value }` for the user callbacks. */
function toSheetRecord(headers: string[], raw: unknown[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  headers.forEach((h, i) => {
    if (h) out[h] = raw[i] ?? ''
  })
  return out
}

/** Run an import against a grid. The implementation behind `table.import()`. */
export async function importTable<T = any>(
  options: MonoImportOptions<T>,
  bridge: TableImportBridge<T>,
): Promise<MonoImportResult<T>> {
  if (!options?.match?.length) {
    throw new Error('[mono-import] `match` is required — an import needs a key to pair rows on.')
  }
  if (!options?.columns?.length) {
    throw new Error('[mono-import] `columns` is required — nothing would be imported otherwise.')
  }

  const { headers, rows } = await parseSheet(options as MonoImportOptions)
  const headerIndex = buildHeaderIndex(headers, options.headerAliases)

  const missingHeaders = [...options.match, ...options.columns]
    .map((m) => m.excel)
    .filter((h) => !headerIndex.has(normalizeHeader(h)))

  // Only columns actually present can be written; a sheet missing one column
  // should still import the rest rather than failing outright.
  const activeColumns = options.columns.filter((c) => headerIndex.has(normalizeHeader(c.excel)))
  const activeMatch = options.match.filter((m) => headerIndex.has(normalizeHeader(m.excel)))

  const target = options.target ?? (await bridge.getData())

  const result: MonoImportResult<T> = {
    ok: false,
    total: 0,
    matched: 0,
    unmatched: 0,
    ambiguous: 0,
    changed: 0,
    skipped: 0,
    headers,
    missingHeaders,
    changes: [],
    unmatchedRows: [],
    ambiguousRows: [],
    skippedRows: [],
    merged: target,
    apply: () => {},
  }

  if (!activeMatch.length || !activeColumns.length) {
    if (options.debug) {
      console.warn('[mono-import] nothing to do — missing headers:', missingHeaders)
    }
    return result
  }

  const matcher = createMatcher(activeMatch, target, {
    minKeyFields: options.minKeyFields,
    targetFilter: options.targetFilter,
    normalize: options.normalizeKey,
  })

  const patchesByIndex = new Map<number, { row: T; patch: Record<string, unknown> }>()
  const numberFormat = options.numberFormat ?? 'auto'
  const allowNegative = options.allowNegative ?? true
  const chunkSize = Math.max(1, Math.floor(options.chunkSize ?? 300))
  const yieldMs = Math.max(0, options.yieldMs ?? 0)

  const cellOf = (raw: unknown[], excel: string): unknown => {
    const i = headerIndex.get(normalizeHeader(excel))
    return i === undefined ? undefined : raw[i]
  }

  for (let start = 0; start < rows.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, rows.length)

    for (let ri = start; ri < end; ri += 1) {
      const raw = rows[ri]
      const record = toSheetRecord(headers, raw)

      if (options.rowFilter && !options.rowFilter(record, ri)) continue
      result.total += 1

      const outcome = findMatch(matcher, (leg) => cellOf(raw, leg.excel))

      if (outcome.kind === 'miss') {
        result.unmatched += 1
        result.unmatchedRows.push({ index: ri, row: record })
        continue
      }
      if (outcome.kind === 'ambiguous') {
        result.ambiguous += 1
        result.ambiguousRows.push({
          index: ri,
          row: record,
          candidates: outcome.candidates,
          reason: `matched ${outcome.candidates} rows on ${outcome.scheme.map((s) => s.field).join(' + ')}`,
        })
        continue
      }

      result.matched += 1
      const { row, index } = outcome.entry
      let touched = false

      for (const column of activeColumns as Array<MonoImportColumn<T>>) {
        const veto = options.readOnly?.(row, column.field)
        if (veto) {
          result.skipped += 1
          result.skippedRows.push({
            index: ri,
            row: record,
            reason: typeof veto === 'string' ? veto : `${column.field} is read-only`,
          })
          continue
        }

        const rawCell = cellOf(raw, column.excel)
        let value = coerceValue(rawCell, column.type, { numberFormat, allowNegative })
        if (value === undefined) continue // unparseable — leave the cell alone

        if (column.transform) {
          value = column.transform(value, { row, field: column.field, raw: rawCell })
          if (value === undefined) continue
        }

        const current = (row as Record<string, unknown>)[column.field]
        if (isSameValue(current, value, column.type)) continue

        const entry = patchesByIndex.get(index) ?? { row, patch: {} }
        entry.patch[column.field] = value
        patchesByIndex.set(index, entry)
        touched = true
      }

      if (touched) result.changed += 1
    }

    options.onProgress?.(end, rows.length)
    // Yield between chunks so a large paste can't freeze the page.
    if (yieldMs >= 0 && end < rows.length) await sleep(yieldMs)
  }

  result.changes = [...patchesByIndex.entries()].map(([index, { row, patch }]) => ({
    rowKey: bridge.rowKeyOf(row, index),
    key: bridge.serverKeyOf(row),
    row,
    patch,
  }))

  result.merged = target.map((row, i) => {
    const entry = patchesByIndex.get(i)
    return entry ? ({ ...row, ...entry.patch } as T) : row
  })

  result.ok =
    result.total > 0 &&
    result.matched === result.total &&
    result.unmatched === 0 &&
    result.ambiguous === 0

  if (options.debug) {
    console.debug('[mono-import]', {
      headers,
      missingHeaders,
      schemes: matcher.schemes.map((s) => s.map((l) => l.field)),
      ...{
        total: result.total,
        matched: result.matched,
        unmatched: result.unmatched,
        ambiguous: result.ambiguous,
        changed: result.changed,
        skipped: result.skipped,
      },
    })
  }

  let applied = false
  result.apply = () => {
    if (applied || !result.changes.length) return
    applied = true
    bridge.stageImported(result.changes)
  }

  if ((options.apply ?? 'stage') === 'stage') result.apply()

  return result
}
