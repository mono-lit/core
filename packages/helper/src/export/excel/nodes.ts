/**
 * mdast → worksheet. One `WorksheetWriter` walks the tree, appending rows and
 * applying the directives each cell carries.
 *
 * The interesting problems solved here:
 * - **Cell typing** — a directive's raw value wins; otherwise a purely numeric
 *   string becomes a number and an ISO date becomes a Date, so the spreadsheet
 *   is actually computable instead of a wall of text.
 * - **Formula placeholders** — a template can't know which row it will land on,
 *   so `{row}` / `{firstRow}` / `{lastRow}` / `{col:Field}` are substituted at
 *   write time, when the answer is finally known.
 * - **Column geometry** — headings and paragraphs merge across the width of the
 *   widest table on the sheet, which is only known once everything is written;
 *   they're recorded and merged in a second pass.
 */

import type { Root, RootContent, TableCell, TableRow } from 'mdast'
import { flattenInline, type InlineText } from '../markdown'
import type { MonoExportDirective } from '../sentinel'
import {
  combineStyles,
  toExcelStyle,
  type ExcelCellStyle,
} from '../styles'
import type { MonoExportColumn, MonoExportStyle, MonoExportStyles } from '../types'

/** An ISO date string (`2026-07-21`, optionally with a time part). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/
/** A plain number, allowing a leading sign and a decimal part. */
const NUMERIC_RE = /^[+-]?\d+(?:\.\d+)?$/

/** A pending image to place once the sheet is written. */
interface PendingImage {
  src: string
  row: number
  col: number
  width: number
  height: number
}

/** A block that should span the sheet's full width (headings, paragraphs). */
interface PendingSpan {
  row: number
  from: number
}

export interface WriterContext {
  styles: MonoExportStyles
  columns?: MonoExportColumn[]
}

/** Everything the walk produces, handed back to the ExcelJS driver. */
export interface WorksheetPlan {
  rows: PlannedRow[]
  images: PendingImage[]
  /** Rows to merge across the sheet width (heading / paragraph blocks). */
  spans: PendingSpan[]
  /** Explicit merges requested with `{{merge}}`: `[row, col, rowEnd, colEnd]`. */
  merges: Array<[number, number, number, number]>
  /** Widest row, i.e. how many columns the sheet has. */
  width: number
  /** Longest rendered text per column, for auto-fit. */
  widths: number[]
}

export interface PlannedCell {
  /** The value written into the cell (already typed). */
  value: string | number | Date | null
  /** An Excel formula, replacing `value` when present. */
  formula?: string
  style: ExcelCellStyle
  /** Number format from a value directive, layered over the style's. */
  numFmt?: string
  /**
   * A hyperlink target, straight from the Markdown link the template wrote.
   *
   * `sheet:<key>` is resolved to an in-workbook reference once every sheet
   * exists and its final (sanitised, deduped) name is known — a template cannot
   * know that name, so it references the key instead. Anything else is passed
   * through as an external URL.
   */
  hyperlink?: string
  /**
   * How wide the cell *displays*, in characters — used for auto-fit. Kept
   * separate from `value` because a Date's `toString()` is ~55 characters while
   * the cell shows 10, which would blow the column out.
   */
  width: number
}

export interface PlannedRow {
  cells: PlannedCell[]
  height?: number
}

/**
 * Walks an mdast tree and plans a worksheet. Planning (rather than writing
 * ExcelJS objects directly) keeps this file free of any ExcelJS import, so the
 * mapping stays testable and a future renderer can reuse the same walk.
 */
export class WorksheetWriter {
  private readonly plan: WorksheetPlan = {
    rows: [],
    images: [],
    spans: [],
    merges: [],
    width: 0,
    widths: [],
  }

  /** Header captions of the table currently being written, for `{col:Field}`. */
  private tableColumns: string[] = []
  /** 1-based row index of the current table's first body row. */
  private tableFirstRow = 0
  /** 1-based row index of the current table's last body row. */
  private tableLastRow = 0

  constructor(private readonly ctx: WriterContext) {}

  /** Resolve a named style, or an empty style when the name is unknown. */
  private named(name: string | undefined): MonoExportStyle {
    return (name && this.ctx.styles[name]) || {}
  }

  write(root: Root): WorksheetPlan {
    this.writeBlocks(root.children)
    this.plan.width = this.plan.rows.reduce((max, row) => Math.max(max, row.cells.length), 0)
    return this.plan
  }

  private writeBlocks(nodes: readonly RootContent[], indent = 0): void {
    for (const node of nodes) this.writeBlock(node, indent)
  }

  private writeBlock(node: RootContent, indent: number): void {
    switch (node.type) {
      case 'heading': {
        const inline = flattenInline(node.children)
        const style = combineStyles(this.named(`h${node.depth}`), this.styleFrom(inline.directives))
        this.appendSpanningRow(inline, style)
        break
      }
      case 'paragraph': {
        const inline = flattenInline(node.children)
        // A paragraph holding nothing but directives (e.g. a lone `{{image}}`)
        // still needs a row to anchor them to.
        const style = combineStyles(this.styleFrom(inline.directives), { indent })
        this.appendSpanningRow(inline, style)
        break
      }
      case 'table':
        this.writeTable(node.children as TableRow[])
        break
      case 'list':
        for (const item of node.children) {
          this.writeBlocks(item.children as RootContent[], indent + 1)
        }
        break
      case 'blockquote':
        this.writeBlockquote(node.children as RootContent[], indent)
        break
      case 'code':
        for (const line of node.value.split('\n')) {
          this.pushRow([{ value: line, style: {}, width: line.length }], undefined, true)
        }
        break
      case 'thematicBreak':
        this.pushRow([{ value: null, style: {}, width: 0 }], undefined, true)
        break
      default:
        if ('children' in node) this.writeBlocks(node.children as RootContent[], indent)
    }
  }

  private writeBlockquote(children: readonly RootContent[], indent: number): void {
    const before = this.plan.rows.length
    this.writeBlocks(children, indent)
    const note = toExcelStyle(this.named('note'))
    for (let i = before; i < this.plan.rows.length; i += 1) {
      for (const cell of this.plan.rows[i].cells) {
        cell.style = mergeExcelStyle(note, cell.style)
      }
    }
  }

  /** A one-cell row that will later be merged across the sheet's full width. */
  private appendSpanningRow(inline: InlineText, style: MonoExportStyle): void {
    const cell = this.toCell(inline, style)
    if (cell.value === null && !cell.formula && !inline.directives.length && !inline.images.length) {
      return // a blank paragraph — nothing to write
    }
    const rowIndex = this.pushRow([cell], style.height, true)
    this.plan.spans.push({ row: rowIndex, from: 1 })
    this.placeImages(inline, rowIndex, 1)
    this.applyMerge(inline.directives, rowIndex, 1)
  }

  private writeTable(rows: readonly TableRow[]): void {
    if (!rows.length) return

    const [headerRow, ...bodyRows] = rows
    const headerInlines = (headerRow.children as TableCell[]).map((cell) =>
      flattenInline(cell.children),
    )
    this.tableColumns = headerInlines.map((inline) => inline.text.trim())

    // The header row carries directives too — a two-level header is written as
    // `{{merge cols=2}}` here plus a `{{rowStyle "header"}}` body row beneath it.
    const headerStyle = this.named('header')
    const headerRowIndex = this.pushRow(
      headerInlines.map((inline) =>
        this.toCell(inline, combineStyles(headerStyle, this.styleFrom(inline.directives))),
      ),
      headerStyle.height,
    )
    headerInlines.forEach((inline, index) => {
      this.placeImages(inline, headerRowIndex, index + 1)
      this.applyMerge(inline.directives, headerRowIndex, index + 1)
    })

    // Body rows are written in two passes: the first materialises the cells (so
    // `{lastRow}` is known), the second resolves formulas against the real range.
    this.tableFirstRow = this.plan.rows.length + 1
    this.tableLastRow = this.tableFirstRow + bodyRows.length - 1

    for (const bodyRow of bodyRows) {
      const inlines = (bodyRow.children as TableCell[]).map((cell) => flattenInline(cell.children))
      const rowDirectives = inlines.flatMap((inline) => inline.directives)
      const rowStyle = this.rowStyleFrom(rowDirectives)
      const cells = inlines.map((inline, index) =>
        this.toCell(
          inline,
          combineStyles(rowStyle, this.columnStyle(index), this.styleFrom(inline.directives)),
        ),
      )
      const rowIndex = this.pushRow(cells, rowStyle.height)
      inlines.forEach((inline, index) => {
        this.placeImages(inline, rowIndex, index + 1)
        this.applyMerge(inline.directives, rowIndex, index + 1)
      })
    }

    this.tableColumns = []
  }

  /** Per-column `numFmt` override from `options.columns`. */
  private columnStyle(index: number): MonoExportStyle {
    const numFmt = this.ctx.columns?.[index]?.numFmt
    return numFmt ? { numFmt } : {}
  }

  /** Collect `{{style}}` directives into one style object. */
  private styleFrom(directives: readonly MonoExportDirective[]): MonoExportStyle {
    return combineStyles(
      ...directives
        .filter((d): d is Extract<MonoExportDirective, { k: 'style' }> => d.k === 'style')
        .map((d) => this.named(d.v)),
    )
  }

  /** Collect `{{rowStyle}}` directives into one style object. */
  private rowStyleFrom(directives: readonly MonoExportDirective[]): MonoExportStyle {
    return combineStyles(
      ...directives
        .filter((d): d is Extract<MonoExportDirective, { k: 'rowStyle' }> => d.k === 'rowStyle')
        .map((d) => this.named(d.v)),
    )
  }

  /** Build one planned cell from flattened inline content plus its style. */
  private toCell(inline: InlineText, style: MonoExportStyle): PlannedCell {
    const value = inline.directives.find(
      (d): d is Extract<MonoExportDirective, { k: 'val' }> => d.k === 'val',
    )
    const formula = inline.directives.find(
      (d): d is Extract<MonoExportDirective, { k: 'formula' }> => d.k === 'formula',
    )

    const inlineStyle: MonoExportStyle = {
      ...(inline.bold ? { bold: true } : {}),
      ...(inline.italic ? { italic: true } : {}),
    }
    const excelStyle = toExcelStyle(combineStyles(inlineStyle, style))
    // The flattened text is exactly what a reader sees (`$5,000.00`), which is
    // the right yardstick for column width whatever the underlying cell type.
    const width = inline.text.trim().length

    // `markdown.ts` has always recorded the first link URL of a run; until now
    // nothing read it, so a Markdown link rendered as plain text in xlsx.
    const link = inline.link ? { hyperlink: inline.link } : undefined

    if (formula) {
      return {
        value: null,
        formula: this.resolveFormula(formula.v),
        style: excelStyle,
        numFmt: value?.f ?? style.numFmt,
        width: Math.max(width, 10),
        ...link,
      }
    }

    // The raw value replaces the cell only when the formatted text IS the whole
    // cell. In prose ("Rate 15.50% this quarter") the sentence must survive.
    const isLoneValue = !!value && (value.t == null || value.t.trim() === inline.text.trim())

    if (value && isLoneValue) {
      if (typeof value.n === 'number') {
        return { value: value.n, style: excelStyle, numFmt: value.f, width, ...link }
      }
      if (value.d) {
        const date = new Date(value.d)
        if (!Number.isNaN(date.getTime())) {
          return { value: date, style: excelStyle, numFmt: value.f, width, ...link }
        }
      }
    }

    return { value: coerceValue(inline.text), style: excelStyle, width, ...link }
  }

  /**
   * Substitute the placeholders a template couldn't resolve on its own:
   * `{row}` (the row about to be written), `{prevRow}` (the one above it),
   * `{firstRow}` / `{lastRow}` (the current table's body range) and
   * `{col:Caption}` (that header's column letter).
   *
   * `{lastRow}` includes *every* body row — so a total row that lives inside
   * the same Markdown table must sum `{firstRow}:{prevRow}` to avoid a circular
   * reference to itself.
   */
  private resolveFormula(expr: string): string {
    const row = this.plan.rows.length + 1
    return expr
      .replace(/\{row\}/g, String(row))
      .replace(/\{prevRow\}/g, String(Math.max(1, row - 1)))
      .replace(/\{firstRow\}/g, String(this.tableFirstRow || row))
      .replace(/\{lastRow\}/g, String(this.tableLastRow || row))
      .replace(/\{col:([^}]+)\}/g, (_match, caption: string) => {
        const index = this.tableColumns.findIndex(
          (c) => c.toLowerCase() === caption.trim().toLowerCase(),
        )
        return index >= 0 ? columnLetter(index + 1) : caption
      })
  }

  private placeImages(inline: InlineText, row: number, col: number): void {
    const directives = inline.directives.filter(
      (d): d is Extract<MonoExportDirective, { k: 'image' }> => d.k === 'image',
    )
    for (const d of directives) {
      this.plan.images.push({
        src: d.v,
        row,
        col,
        width: d.width ?? 120,
        height: d.height ?? 40,
      })
    }
    for (const img of inline.images) {
      this.plan.images.push({ src: img.url, row, col, width: 120, height: 40 })
    }
  }

  private applyMerge(directives: readonly MonoExportDirective[], row: number, col: number): void {
    const merge = directives.find(
      (d): d is Extract<MonoExportDirective, { k: 'merge' }> => d.k === 'merge',
    )
    if (!merge) return
    const colEnd = col + Math.max(1, merge.cols ?? 1) - 1
    const rowEnd = row + Math.max(1, merge.rows ?? 1) - 1
    if (colEnd === col && rowEnd === row) return
    this.plan.merges.push([row, col, rowEnd, colEnd])
  }

  /**
   * Append a row and return its 1-based index. `spanning` rows (headings,
   * paragraphs) are excluded from auto-fit: they get merged across the whole
   * sheet, so letting a long title set column A's width would leave a 60-wide
   * first column next to four narrow ones.
   */
  private pushRow(cells: PlannedCell[], height?: number, spanning = false): number {
    this.plan.rows.push({ cells, ...(height ? { height } : {}) })
    if (!spanning) {
      cells.forEach((cell, index) => {
        this.plan.widths[index] = Math.max(this.plan.widths[index] ?? 0, cell.width)
      })
    }
    return this.plan.rows.length
  }
}

/** Later style wins, but per sub-object so a font isn't wiped by a fill. */
function mergeExcelStyle(base: ExcelCellStyle, over: ExcelCellStyle): ExcelCellStyle {
  return {
    ...base,
    ...over,
    font: { ...base.font, ...over.font },
    alignment: { ...base.alignment, ...over.alignment },
    border: { ...base.border, ...over.border },
  }
}

/**
 * Give a plain cell string its most useful type. Text that merely *looks*
 * numeric (`"00123"`, `"1,234"`) is left alone — coercing it would silently
 * mangle invoice numbers and phone numbers.
 */
export function coerceValue(text: string): string | number | Date | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (NUMERIC_RE.test(trimmed) && !/^0\d/.test(trimmed)) {
    const n = Number(trimmed)
    if (Number.isFinite(n)) return n
  }
  if (ISO_DATE_RE.test(trimmed)) {
    const date = new Date(trimmed)
    if (!Number.isNaN(date.getTime())) return date
  }
  return text
}

/** 1-based column index → spreadsheet letter (1 → A, 27 → AA). */
export function columnLetter(index: number): string {
  let n = index
  let out = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}
