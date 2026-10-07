/**
 * Named styles — the semantic vocabulary templates use instead of raw ExcelJS
 * configuration.
 *
 * A template says `{{style "groupHeader"}}`; what that *means* is decided here
 * and translated per renderer. That indirection is what lets the same template
 * later render to PDF or HTML: only `toExcelStyle` (and its future siblings)
 * knows about a concrete output format.
 */

import type { MonoExportStyle, MonoExportStyles } from './types'

/**
 * Built-in styles. Consumers override individual keys via `options.styles`
 * without having to redefine a whole style.
 */
export const DEFAULT_STYLES: MonoExportStyles = {
  title: { bold: true, size: 16, align: 'left', height: 24 },
  h1: { bold: true, size: 16, height: 24 },
  h2: { bold: true, size: 14, height: 21 },
  h3: { bold: true, size: 12, height: 18 },
  h4: { bold: true, size: 11 },
  h5: { bold: true, size: 11 },
  h6: { bold: true, size: 11, italic: true },
  /** Table header row. */
  header: {
    bold: true,
    color: '#FFFFFF',
    bg: '#374151',
    align: 'center',
    valign: 'middle',
    border: 'all',
    wrap: true,
  },
  /** A group's banner row above its rows. */
  groupHeader: { bold: true, bg: '#E5E7EB', border: 'bottom' },
  /** A subtotal / grand-total row. */
  total: { bold: true, bg: '#F3F4F6', border: 'top' },
  currency: { numFmt: '#,##0.00', align: 'right' },
  number: { numFmt: '#,##0', align: 'right' },
  date: { numFmt: 'yyyy-mm-dd', align: 'center' },
  note: { italic: true, color: '#6B7280' },
  danger: { color: '#991B1B', bg: '#FEE2E2' },
  success: { color: '#065F46', bg: '#D1FAE5' },
  muted: { color: '#9CA3AF' },
  /* Excel's own hyperlink blue. Colour matters as much as the underline: the
     prior art this feature is modelled on underlines only, so its links render
     black and nobody reads them as links. */
  link: { color: '#0563C1', underline: true },
}

/** Merge user styles over the defaults, per style name (shallow, key by key). */
export function mergeStyles(overrides: MonoExportStyles = {}): MonoExportStyles {
  const merged: MonoExportStyles = {}
  for (const [name, style] of Object.entries(DEFAULT_STYLES)) merged[name] = { ...style }
  for (const [name, style] of Object.entries(overrides)) {
    merged[name] = { ...(merged[name] ?? {}), ...style }
  }
  return merged
}

/** Later styles win, key by key — used to layer row style → cell style. */
export function combineStyles(
  ...styles: Array<MonoExportStyle | undefined>
): MonoExportStyle {
  return Object.assign({}, ...styles.filter(Boolean)) as MonoExportStyle
}

/**
 * ExcelJS wants `ARGB` without the `#`. Accepts `#rgb`, `#rrggbb` and
 * `#aarrggbb`; anything already 8 hex digits is passed through.
 */
export function toArgb(color: string | undefined): string | undefined {
  if (!color) return undefined
  let hex = color.replace('#', '').trim()
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  if (hex.length === 6) hex = `FF${hex}`
  return /^[0-9a-fA-F]{8}$/.test(hex) ? hex.toUpperCase() : undefined
}

/** One ExcelJS border edge. */
interface ExcelBorderEdge {
  style: 'thin'
  color: { argb: string }
}

/** The subset of ExcelJS cell style options this engine produces. */
export interface ExcelCellStyle {
  font?: Record<string, unknown>
  fill?: Record<string, unknown>
  alignment?: Record<string, unknown>
  border?: Record<string, ExcelBorderEdge>
  numFmt?: string
}

const VALIGN: Record<string, string> = { top: 'top', middle: 'middle', bottom: 'bottom' }

/** Translate a semantic style into ExcelJS cell options. */
export function toExcelStyle(style: MonoExportStyle): ExcelCellStyle {
  const out: ExcelCellStyle = {}

  const font: Record<string, unknown> = {}
  if (style.bold) font.bold = true
  if (style.italic) font.italic = true
  if (style.underline) font.underline = true
  if (style.size) font.size = style.size
  if (style.font) font.name = style.font
  const fontColor = toArgb(style.color)
  if (fontColor) font.color = { argb: fontColor }
  if (Object.keys(font).length) out.font = font

  const bg = toArgb(style.bg)
  if (bg) out.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }

  const alignment: Record<string, unknown> = {}
  if (style.align) alignment.horizontal = style.align
  if (style.valign) alignment.vertical = VALIGN[style.valign]
  if (style.wrap) alignment.wrapText = true
  if (style.indent) alignment.indent = style.indent
  if (Object.keys(alignment).length) out.alignment = alignment

  if (style.border && style.border !== 'none') {
    const edge: ExcelBorderEdge = {
      style: 'thin',
      color: { argb: toArgb(style.borderColor) ?? 'FFD1D5DB' },
    }
    if (style.border === 'all' || style.border === 'outline') {
      out.border = { top: edge, left: edge, bottom: edge, right: edge }
    } else if (style.border === 'bottom') {
      out.border = { bottom: edge }
    } else if (style.border === 'top') {
      out.border = { top: edge }
    }
  }

  if (style.numFmt) out.numFmt = style.numFmt

  return out
}
