/**
 * Getting a `string[][]` grid out of whatever the user handed over — a real
 * `.xlsx` file or the text they copied out of one.
 */

import { cellText } from './coerce'
import type { MonoImportOptions, MonoImportType } from './types'

/** A parsed sheet: the header row plus the data rows beneath it. */
export interface ParsedSheet {
  headers: string[]
  rows: unknown[][]
}

/** Decide how to read `data` when the caller didn't say. */
export function inferType(data: MonoImportOptions['data']): MonoImportType {
  return typeof data === 'string' ? 'copy-paste' : 'excel'
}

/**
 * Pick the delimiter from the text itself. Tab first: that's what a real
 * copy out of Excel produces, and a pasted cell may legitimately contain
 * commas or semicolons.
 */
function guessDelimiter(raw: string): string {
  if (raw.includes('\t')) return '\t'
  const firstLine = raw.split(/\r?\n/, 1)[0] ?? ''
  if (firstLine.split(';').length > firstLine.split(',').length) return ';'
  return ','
}

/**
 * Split delimited text, honouring `"` quoting so a quoted cell can contain the
 * delimiter or a newline — which CSV exports out of Excel routinely produce.
 */
function splitDelimited(raw: string, delimiter: string): string[][] {
  const out: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]

    if (quoted) {
      if (ch === '"') {
        if (raw[i + 1] === '"') {
          cell += '"' // an escaped quote inside a quoted cell
          i += 1
        } else {
          quoted = false
        }
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      quoted = true
      continue
    }
    if (ch === delimiter) {
      row.push(cell)
      cell = ''
      continue
    }
    if (ch === '\r') continue
    if (ch === '\n') {
      row.push(cell)
      out.push(row)
      row = []
      cell = ''
      continue
    }
    cell += ch
  }

  if (cell !== '' || row.length) {
    row.push(cell)
    out.push(row)
  }

  // Drop trailing blank lines, but keep blank rows in the middle — they may be
  // meaningful spacing the caller's `rowFilter` wants to see.
  while (out.length && out[out.length - 1].every((c) => String(c).trim() === '')) out.pop()

  return out.map((r) => r.map((c) => c.trim()))
}

/** Load the optional `exceljs` peer, with an actionable error when it's absent. */
async function loadExcelJs(): Promise<any> {
  try {
    const mod: any = await import('exceljs')
    return mod?.default ?? mod
  } catch (err) {
    throw new Error(
      '[mono-import] reading an .xlsx needs the optional peer dependency "exceljs". ' +
        'Install it in your app: pnpm add exceljs' +
        (err instanceof Error ? `\n  (resolution failed: ${err.message})` : ''),
    )
  }
}

/** Normalise every accepted binary shape into an ArrayBuffer. */
async function toArrayBuffer(data: File | Blob | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  }
  if (typeof (data as Blob).arrayBuffer === 'function') return (data as Blob).arrayBuffer()
  throw new Error('[mono-import] `data` must be a File, Blob, ArrayBuffer, Uint8Array or string.')
}

/** Read a worksheet into a dense matrix of raw cell values. */
async function readWorkbook(
  data: File | Blob | ArrayBuffer | Uint8Array,
  sheet: string | number | undefined,
): Promise<unknown[][]> {
  const ExcelJS = await loadExcelJs()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await toArrayBuffer(data))

  const worksheet =
    typeof sheet === 'string'
      ? workbook.getWorksheet(sheet)
      : workbook.worksheets[typeof sheet === 'number' ? sheet : 0]

  if (!worksheet) {
    const names = workbook.worksheets.map((w: any) => w.name).join(', ')
    throw new Error(`[mono-import] worksheet ${JSON.stringify(sheet)} not found. Available: ${names}`)
  }

  const matrix: unknown[][] = []
  worksheet.eachRow({ includeEmpty: true }, (row: any) => {
    const cells: unknown[] = []
    // `row.values` is 1-based with a hole at index 0.
    const values = row.values as unknown[]
    for (let c = 1; c < values.length; c += 1) cells.push(values[c])
    matrix.push(cells)
  })
  return matrix
}

/**
 * Parse the caller's `data` into headers + rows.
 *
 * Rows above `headerRow` are dropped, which is what lets a sheet carry a title
 * block above its table.
 */
export async function parseSheet(options: MonoImportOptions): Promise<ParsedSheet> {
  const type = options.type ?? inferType(options.data)

  let matrix: unknown[][]
  if (type === 'copy-paste') {
    if (typeof options.data !== 'string') {
      throw new Error("[mono-import] type 'copy-paste' needs `data` to be a string.")
    }
    const delimiter = options.delimiter ?? guessDelimiter(options.data)
    matrix = splitDelimited(options.data, delimiter)
  } else {
    if (typeof options.data === 'string') {
      throw new Error("[mono-import] type 'excel' needs `data` to be a File, Blob or ArrayBuffer.")
    }
    matrix = await readWorkbook(options.data, options.sheet)
  }

  const headerIndex = Math.max(1, Math.floor(options.headerRow ?? 1)) - 1
  const headerRow = matrix[headerIndex] ?? []
  const headers = headerRow.map((h) => cellText(h).trim())

  // Blank rows carry no key, so they can never match — drop them here rather
  // than making every consumer's `rowFilter` handle them.
  const rows = matrix
    .slice(headerIndex + 1)
    .filter((r) => r.some((c) => cellText(c).trim() !== ''))

  return { headers, rows }
}
