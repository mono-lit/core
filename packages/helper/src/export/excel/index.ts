/**
 * ExcelJS driver — turns the renderer-independent {@link WorksheetPlan} into a
 * real workbook.
 *
 * ExcelJS is an **optional peer dependency**: it is ~1MB, hosts frequently
 * already ship it, and a Markdown-only report never needs it. It is therefore
 * reached through a dynamic `import()` that only runs when an `.xlsx` is
 * actually requested — which also keeps `monoDataGrid` importable on the
 * server, where ExcelJS has no business being loaded.
 */

import type { Root } from 'mdast'
import { mergeStyles, toExcelStyle } from '../styles'
import type { MonoExportOptions, MonoExportStyles } from '../types'

/** What a template writes to link at a sheet it cannot yet name. */
export const SHEET_LINK_PREFIX = 'sheet:'
import { SheetNames, sheetRef } from '../sheet-name'
import {
  WorksheetWriter,
  columnLetter,
  type PlannedCell,
  type WorksheetPlan,
} from './nodes'

/** Auto-fit bounds, in characters — narrow enough to read, wide enough to fit. */
const MIN_WIDTH = 8
const MAX_WIDTH = 60
/** Extra characters of padding added to the widest cell in a column. */
const WIDTH_PADDING = 2

/** Load the optional `exceljs` peer, with an actionable error when it's absent. */
async function loadExcelJs(): Promise<any> {
  try {
    const mod: any = await import('exceljs')
    return mod?.default ?? mod
  } catch (err) {
    throw new Error(
      '[mono-export] xlsx output needs the optional peer dependency "exceljs". ' +
        'Install it in your app: pnpm add exceljs' +
        (err instanceof Error ? `\n  (resolution failed: ${err.message})` : ''),
    )
  }
}

/**
 * `{{image}}` accepts a data URL, a bare base64 string, or an `http(s)` URL.
 * ExcelJS wants raw base64 plus an extension, so normalise here — and fetch a
 * remote URL, which is the only genuinely async part of image handling.
 */
async function toImagePayload(
  src: string,
): Promise<{ base64: string; extension: 'png' | 'jpeg' | 'gif' } | null> {
  const dataUrl = /^data:image\/(png|jpe?g|gif);base64,(.+)$/i.exec(src)
  if (dataUrl) {
    const ext = dataUrl[1].toLowerCase()
    return {
      base64: dataUrl[2],
      extension: ext === 'gif' ? 'gif' : ext === 'png' ? 'png' : 'jpeg',
    }
  }

  if (/^https?:\/\//i.test(src)) {
    try {
      const res = await fetch(src)
      if (!res.ok) return null
      const buffer = await res.arrayBuffer()
      const type = res.headers.get('content-type') ?? ''
      const extension = type.includes('gif') ? 'gif' : type.includes('png') ? 'png' : 'jpeg'
      return { base64: arrayBufferToBase64(buffer), extension }
    } catch {
      // A missing logo must not fail the whole report.
      return null
    }
  }

  // Assume a bare base64 payload; PNG is the safe default.
  return /^[A-Za-z0-9+/=\s]+$/.test(src) ? { base64: src.trim(), extension: 'png' } : null
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return typeof btoa === 'function'
    ? btoa(binary)
    : (globalThis as any).Buffer.from(bytes).toString('base64')
}

/** One extra worksheet: a parsed detail report plus the key that links to it. */
export interface RenderExcelSheet {
  /** The value the master template linked to, i.e. `sheet:<key>`. */
  key: string
  /** Preferred name. Sanitised and de-duplicated before use. */
  name: string
  ast: Root
}

/**
 * Options the driver reads.
 *
 * Spelled out rather than `Pick<>`-ed from a list that has to be kept in step:
 * an option added to `MonoExportOptions` and not here silently never reaches
 * the driver, and nothing fails to compile.
 */
export interface RenderExcelOptions
  extends Pick<MonoExportOptions, 'styles' | 'columns' | 'sheetName' | 'freezeRows'> {
  /** Extra sheets, rendered after the master and linked from it. */
  sheets?: RenderExcelSheet[]
  /** Add a `← Back` link to `A1` of every extra sheet. */
  back?: boolean
}

/** Build the ExcelJS workbook for a parsed report. */
export async function renderExcel(ast: Root, options: RenderExcelOptions = {}): Promise<any> {
  const styles = mergeStyles(options.styles)
  const plan = new WorksheetWriter({ styles, columns: options.columns }).write(ast)

  const ExcelJS = await loadExcelJs()
  const workbook = new ExcelJS.Workbook()
  workbook.created = new Date()

  // One registry for the whole workbook, claimed once per sheet.
  const names = new SheetNames()
  const masterName = names.take(options.sheetName ?? 'Sheet1', 'Sheet1')
  const sheet = workbook.addWorksheet(masterName)

  // `sheet:` links are parked here as they are written and resolved at the end:
  // the master's rows are written before any detail sheet exists, so the name
  // to link to is not known yet.
  const pending: PendingSheetLink[] = []

  writeRows(sheet, plan, pending)
  applyMerges(sheet, plan)
  applyWidths(sheet, plan, options.columns)

  if (options.freezeRows) {
    sheet.views = [{ state: 'frozen', ySplit: options.freezeRows }]
  }

  await placeImages(workbook, sheet, plan)

  // Each detail sheet gets its OWN writer. `WorksheetPlan.width` is "the widest
  // row on this sheet" and drives every heading merge in `applyMerges`, so one
  // plan can only ever describe one sheet.
  const targets = new Map<string, string>()
  for (const spec of options.sheets ?? []) {
    const name = names.take(spec.name || spec.key, 'Detail')
    targets.set(spec.key, name)

    const detailPlan = new WorksheetWriter({ styles, columns: options.columns }).write(spec.ast)
    const detailSheet = workbook.addWorksheet(name)

    if (options.back !== false) {
      const back = detailSheet.addRow([]).getCell(1)
      back.value = { text: '← Back', hyperlink: sheetRef(masterName) }
      back.font = { ...(toExcelStyle(styles.link ?? {}).font ?? {}), bold: true }
    }

    writeRows(detailSheet, detailPlan, pending)
    applyMerges(detailSheet, detailPlan)
    applyWidths(detailSheet, detailPlan, options.columns)
    await placeImages(workbook, detailSheet, detailPlan)
  }

  applySheetLinks(pending, targets, styles)

  return workbook
}

/**
 * Rewrite every `sheet:<key>` target into a real in-workbook reference.
 *
 * Done last, and only here, because a template cannot know the name it is
 * linking to: names are sanitised for Excel and de-duplicated against the
 * workbook, both of which need every sheet to exist first.
 *
 * A key with no sheet — a document whose details failed to load, or had none —
 * has its link REMOVED rather than left dangling. The prior art leaves those
 * cells underlined and unclickable, which reads as a broken link.
 */
function applySheetLinks(
  pending: PendingSheetLink[],
  targets: Map<string, string>,
  styles: MonoExportStyles,
): void {
  const linkFont = styles.link ? toExcelStyle(styles.link).font : undefined

  for (const link of pending) {
    const name = targets.get(link.key)

    // No sheet for this key — the document had no rows, or its load failed.
    // The cell already holds its plain value and was never linked, so there is
    // nothing to undo. Walking the finished workbook to strip a link instead
    // could not do this safely: a numeric cell linked via HYPERLINK() has no
    // `cell.hyperlink` to find, and reading its display text back turned the
    // number into a string.
    if (!name) continue

    applyHyperlink(link.cell, sheetRef(name), link.value)
    if (linkFont) link.cell.font = { ...(link.cell.font ?? {}), ...linkFont }
  }
}

/**
 * Attach a link to a cell without wrecking what is already in it.
 *
 * `cell.hyperlink` looks assignable — ExcelJS' own typings declare it on
 * `Cell` — but at runtime it is a GETTER ONLY (`lib/doc/cell.js:201`), so
 * assigning it throws. The only public route is the value form, and that form
 * replaces the cell outright: a number linked this way stops being a number and
 * no longer sums in Excel. `numFmt` does survive, since it lives on the style
 * rather than the value, but the type does not.
 *
 * So each kind of cell takes the route that costs it nothing:
 *
 *   · number   — Excel's own HYPERLINK(), with the number as the displayed
 *                argument and cached as `result`. Stays numeric, still sums,
 *                still formats.
 *   · text     — the plain value form, which for a string loses nothing at all.
 *                A Date takes this route too and becomes text; dates as link
 *                anchors are not a case this feature has, and the alternative
 *                is emitting a serial number nobody can read.
 *
 * Formula cells never reach here: a formula owns `cell.value`, so there is no
 * way to add a link without destroying it, and silently swapping one for the
 * other would be worse than not linking. Callers skip them.
 */
function applyHyperlink(cell: any, target: string, value: PlannedCell['value']): void {
  if (typeof value === 'number') {
    cell.value = {
      formula: `HYPERLINK(${quoteFormulaArg(target)},${value})`,
      result: value,
    }
    return
  }

  cell.value = { text: String(value ?? ''), hyperlink: target }
}

/**
 * A `sheet:<key>` link whose destination is not known yet, held until every
 * worksheet exists. Keeping the cell and its ORIGINAL value — rather than
 * re-reading them off the finished workbook — is what makes the numeric case
 * work: once written, a HYPERLINK() formula no longer looks like a link.
 */
interface PendingSheetLink {
  cell: any
  key: string
  value: PlannedCell['value']
}

/** A string literal inside an Excel formula: wrapped, with `"` doubled. */
function quoteFormulaArg(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function writeRows(sheet: any, plan: WorksheetPlan, pending?: PendingSheetLink[]): void {
  for (const plannedRow of plan.rows) {
    const row = sheet.addRow([])
    plannedRow.cells.forEach((planned, index) => {
      const cell = row.getCell(index + 1)
      if (planned.formula) cell.value = { formula: planned.formula }
      else if (planned.value !== null) cell.value = planned.value

      // Assigning `cell.style` wholesale would drop anything ExcelJS already
      // derived, so apply the sub-objects individually.
      if (planned.style.font) cell.font = planned.style.font
      if (planned.style.fill) cell.fill = planned.style.fill
      if (planned.style.alignment) cell.alignment = planned.style.alignment
      if (planned.style.border) cell.border = planned.style.border
      const numFmt = planned.numFmt ?? planned.style.numFmt
      if (numFmt) cell.numFmt = numFmt

      // A formula owns the cell's value, so it can carry no link (see
      // `applyHyperlink`).
      if (planned.hyperlink && !planned.formula) {
        if (pending && planned.hyperlink.startsWith(SHEET_LINK_PREFIX)) {
          pending.push({
            cell,
            key: planned.hyperlink.slice(SHEET_LINK_PREFIX.length),
            value: planned.value,
          })
        } else {
          applyHyperlink(cell, planned.hyperlink, planned.value)
        }
      }
    })
    if (plannedRow.height) row.height = plannedRow.height
    row.commit?.()
  }
}

function applyMerges(sheet: any, plan: WorksheetPlan): void {
  // Headings / paragraphs span the full sheet width, which is only known once
  // every table has been written — hence this second pass.
  for (const span of plan.spans) {
    if (plan.width > span.from) safeMerge(sheet, span.row, span.from, span.row, plan.width)
  }
  for (const [row, col, rowEnd, colEnd] of plan.merges) {
    safeMerge(sheet, row, col, rowEnd, colEnd)
  }
}

/**
 * ExcelJS throws when two merges overlap. A template that merges a cell inside
 * a heading row is a mistake, not a reason to lose the whole report — so log
 * and keep going.
 */
function safeMerge(sheet: any, top: number, left: number, bottom: number, right: number): void {
  try {
    sheet.mergeCells(top, left, bottom, right)
  } catch {
    console.warn(
      `[mono-export] skipped overlapping merge ${columnLetter(left)}${top}:${columnLetter(right)}${bottom}`,
    )
  }
}

function applyWidths(sheet: any, plan: WorksheetPlan, columns?: MonoExportOptions['columns']): void {
  for (let i = 0; i < plan.width; i += 1) {
    const explicit = columns?.[i]?.width
    const measured = (plan.widths[i] ?? 0) + WIDTH_PADDING
    sheet.getColumn(i + 1).width =
      explicit ?? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, measured))
  }
}

async function placeImages(workbook: any, sheet: any, plan: WorksheetPlan): Promise<void> {
  for (const pending of plan.images) {
    const payload = await toImagePayload(pending.src)
    if (!payload) {
      console.warn(`[mono-export] could not load image: ${pending.src.slice(0, 60)}`)
      continue
    }
    const id = workbook.addImage({ base64: payload.base64, extension: payload.extension })
    sheet.addImage(id, {
      // ExcelJS anchors are 0-based; the plan is 1-based.
      tl: { col: pending.col - 1, row: pending.row - 1 },
      ext: { width: pending.width, height: pending.height },
    })
  }
}
