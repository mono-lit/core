/**
 * `@mono-lit/helper/export` — render a Markdown template into a report.
 *
 * The pipeline: **Handlebars** fills the template from your data, **Jexl**
 * evaluates any `{{= … }}` expressions, **remark** parses the result into an
 * AST, and a renderer walks that AST. Markdown is the template language, so the
 * layout stays readable and diffable, and the data stays separate from the
 * presentation.
 *
 * @example
 * import { exportTable } from '@mono-lit/helper/export'
 * import md from './payroll.md?raw'
 *
 * const report = await exportTable({ md, data: { employees }, fileName: 'payroll.xlsx' })
 * report.markdown // the rendered markdown, for a preview pane
 *
 * Bound to a grid, `monoDataGrid(...).export({ md, … })` does the same thing
 * with the table's rows, groups and columns already in the context.
 */

import { downloadBlob, MIME } from './download'
import { parseMarkdown } from './markdown'
import { stripDirectives } from './sentinel'
import { resolveDetails } from './detail'
import { resolveExportData } from './resolve-data'
import { renderTemplate } from './template'
import type { MonoExportFormat, MonoExportOptions, MonoExportResult } from './types'

export type {
  MonoExportColumn,
  MonoExportFormat,
  MonoExportFormatOptions,
  MonoExportHelper,
  MonoExportOptions,
  MonoExportResult,
  MonoExportStyle,
  MonoExportStyles,
} from './types'
export { DEFAULT_STYLES } from './styles'
export type { MonoExportDirective } from './sentinel'

/** Pick the renderer from a file name's extension. */
function formatFromFileName(fileName: string | undefined): MonoExportFormat | null {
  if (!fileName) return null
  const ext = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  if (ext === 'md' || ext === 'markdown') return 'md'
  return null
}

/** Give a file name the extension its format implies. */
function withExtension(fileName: string, format: MonoExportFormat): string {
  return formatFromFileName(fileName) === format ? fileName : `${fileName}.${format}`
}

/**
 * Render a Markdown report template.
 *
 * When `fileName` is given its extension selects the renderer and the file
 * downloads automatically (pass `download: false` to suppress that). Without
 * one, nothing is written — you just get the result object.
 */
export async function exportTable(options: MonoExportOptions): Promise<MonoExportResult> {
  // Any DataSource handed in via `data` is drained to an array first, so the
  // template only ever deals in plain values.
  const data = await resolveExportData(options.data, { chunkSize: options.chunkSize })

  // `await`: the template engine (handlebars) is an optional peer loaded on
  // demand, so the render stage is async. `exportTable` was already async, so
  // the public API is unchanged.
  const rendered = await renderTemplate({ ...options, data })
  const markdown = stripDirectives(rendered)
  const resolvedFormat = options.format ?? formatFromFileName(options.fileName)

  // Detail sheets are resolved EAGERLY, unlike the workbook, because `skipped`
  // is part of the result a caller reads immediately — deferring it until
  // `workbook()` would mean `result.skipped` was empty at the moment anyone
  // looked at it. `detail` is an xlsx-only feature, so a Markdown-only export
  // simply should not pass it.
  const detailSheets: Array<{ key: string; name: string; markdown: string }> = []
  const skipped: MonoExportResult['skipped'] = []

  if (options.detail) {
    const detail = options.detail
    const masterRows = data[detail.from ?? 'rows']
    const { details, skipped: dropped } = await resolveDetails(
      Array.isArray(masterRows) ? masterRows : [],
      detail,
    )
    skipped.push(...dropped)

    for (const item of details) {
      detailSheets.push({
        key: item.key,
        name: detail.sheetName?.(item.row) ?? item.key,
        // The same pipeline the master goes through, so a detail template has
        // every helper, partial and directive the master does.
        markdown: await renderTemplate({
          ...options,
          md: detail.md,
          data: { row: item.row, rows: item.rows },
        }),
      })
    }
  }

  // The AST and workbook are built at most once, and only if something asks for
  // them — a Markdown-only report never loads ExcelJS. Memoising the *promise*
  // (rather than the workbook) is what lets `onWorkbook` run exactly once while
  // still being awaited by every caller, and it's why mutations a consumer makes
  // via `workbook()` are present in whatever `toBlob` / `download` write later.
  let workbookPromise: Promise<any> | null = null
  const workbook = (): Promise<any> => {
    workbookPromise ??= import('./excel/index')
      .then(({ renderExcel }) =>
        renderExcel(parseMarkdown(rendered), {
          ...options,
          back: options.detail?.back,
          sheets: detailSheets.map((s) => ({
            key: s.key,
            name: s.name,
            ast: parseMarkdown(s.markdown),
          })),
        }),
      )
      .then(async (book) => {
        // Runs before any bytes are produced, so an auto-download triggered by
        // `fileName` still includes whatever the hook changed.
        await options.onWorkbook?.(book)
        return book
      })
    return workbookPromise
  }

  const toBuffer = async (format?: MonoExportFormat): Promise<ArrayBuffer> => {
    const target = format ?? resolvedFormat ?? 'md'
    if (target === 'md') return new TextEncoder().encode(markdown).buffer as ArrayBuffer
    const book = await workbook()
    return (await book.xlsx.writeBuffer()) as ArrayBuffer
  }

  const toBlob = async (format?: MonoExportFormat): Promise<Blob> => {
    const target = format ?? resolvedFormat ?? 'md'
    return new Blob([await toBuffer(target)], { type: MIME[target] })
  }

  const download = async (fileName?: string): Promise<void> => {
    const target = resolvedFormat ?? formatFromFileName(fileName) ?? 'md'
    const name = withExtension(fileName ?? options.fileName ?? 'export', target)
    downloadBlob(await toBlob(target), name)
  }

  const result: MonoExportResult = {
    markdown,
    format: resolvedFormat,
    fileName: options.fileName ?? null,
    // Names as the caller asked for them; the workbook may sanitise or
    // de-duplicate them, and `workbook()` is the source of truth for that.
    sheets: [options.sheetName ?? 'Sheet1', ...detailSheets.map((s) => s.name)],
    skipped,
    toBlob,
    toBuffer,
    workbook,
    download,
  }

  if (options.fileName && options.download !== false) await download()

  return result
}
