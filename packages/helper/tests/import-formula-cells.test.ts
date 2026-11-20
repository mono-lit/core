// @vitest-environment node
// (jsdom's ArrayBuffer is another realm's — jszip then refuses the bytes ExcelJS wrote.)
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { coerceValue } from '../src/import/coerce'
import { parseSheet } from '../src/import/parse'

// Regression: ExcelJS reads a formula cell as `{ formula, result }`, and the reader passed that
// object through untouched — so a number column read `=D3*110%` as "not a number" and the cell
// was dropped (an app treating "no text" as blank then wrote 0 over it).
const sheetWith = async (fill: (ws: ExcelJS.Worksheet) => void) => {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1')
  ws.addRow(['ID', 'JAN', 'FEB'])
  fill(ws)
  const buf = await wb.xlsx.writeBuffer()
  return parseSheet({ data: buf as ArrayBuffer, type: 'excel' } as any)
}

describe('import: formula cells', () => {
  it('reads a formula cell as its saved result', async () => {
    const { rows } = await sheetWith((ws) => {
      ws.addRow(['a', 1000, { formula: 'B2*110%', result: 1100 }])
    })
    expect(rows[0]?.[2]).toBe(1100)
    expect(coerceValue(rows[0]?.[2], 'number')).toBe(1100)
  })

  it('reads a shared formula clone as its saved result', async () => {
    const { rows } = await sheetWith((ws) => {
      ws.addRow(['a', 1000, { formula: 'B2*2', result: 2000, shareType: 'shared', ref: 'C2:C3' } as any])
      ws.addRow(['b', 500, { sharedFormula: 'C2', result: 1000 } as any])
    })
    expect(rows.map((r) => r[2])).toEqual([2000, 1000])
  })

  it('reads a string result as text', async () => {
    const { rows } = await sheetWith((ws) => {
      ws.addRow([{ formula: '"x"&"y"', result: 'xy' }, 1, 2])
    })
    expect(coerceValue(rows[0]?.[0], undefined)).toBe('xy')
  })

  it('reads an error result or a missing result as empty', async () => {
    const { rows } = await sheetWith((ws) => {
      ws.addRow(['a', { formula: 'B9/0', result: { error: '#DIV/0!' } } as any, { formula: 'B2*2' }])
    })
    expect(rows[0]?.[1]).toBeNull()
    expect(rows[0]?.[2]).toBeNull()
    expect(coerceValue(rows[0]?.[1], 'number')).toBeUndefined()
  })
})
