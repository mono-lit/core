import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { coerceValue, toSheetDate } from '../src/export/excel/nodes'
import { createHelpers } from '../src/export/helpers'
import { extractDirectives } from '../src/export/sentinel'

// Regression: ExcelJS writes a Date by its UTC fields, so an export from a UTC+7 browser showed
// every time 7 hours behind the page (18:00 on screen → 11:00 in the sheet).
describe('excel export dates: browser zone (no formatting.timeZone)', () => {
  const tz = process.env.TZ

  beforeAll(() => { process.env.TZ = 'Asia/Jakarta' })
  afterAll(() => { process.env.TZ = tz })

  it('toSheetDate puts the local time in the UTC fields ExcelJS reads', () => {
    // 11:00Z is 18:00 in Jakarta.
    expect(toSheetDate(new Date('2026-11-27T11:00:00Z')).toISOString()).toBe('2026-11-27T18:00:00.000Z')
  })

  it('keeps the local DATE across midnight', () => {
    // 20:30Z on the 27th is 03:30 on the 28th in Jakarta.
    expect(toSheetDate(new Date('2026-11-27T20:30:00Z')).toISOString()).toBe('2026-11-28T03:30:00.000Z')
  })

  it('coerceValue applies the same shift to a plain ISO cell', () => {
    const v = coerceValue('2026-11-27T11:00:00Z')
    expect(v).toBeInstanceOf(Date)
    expect((v as Date).toISOString()).toBe('2026-11-27T18:00:00.000Z')
  })
})

// `formatting.timeZone` pins the zone, so the sheet no longer depends on the browser's.
describe('excel export dates: formatting.timeZone', () => {
  const tz = process.env.TZ

  // A browser in a DIFFERENT zone from the one asked for.
  beforeAll(() => { process.env.TZ = 'America/New_York' })
  afterAll(() => { process.env.TZ = tz })

  it('writes the wall clock of the requested zone, not the browser\'s', () => {
    const at = new Date('2026-11-27T11:00:00Z')
    expect(toSheetDate(at, 'Asia/Jakarta').toISOString()).toBe('2026-11-27T18:00:00.000Z') // WIB +7
    expect(toSheetDate(at, 'Asia/Makassar').toISOString()).toBe('2026-11-27T19:00:00.000Z') // WITA +8
    expect(toSheetDate(at, 'UTC').toISOString()).toBe('2026-11-27T11:00:00.000Z')
  })

  it('midnight in the zone is hour 0, not 24', () => {
    // 17:00Z is 00:00 the next day in Jakarta.
    expect(toSheetDate(new Date('2026-11-27T17:00:00Z'), 'Asia/Jakarta').toISOString()).toBe('2026-11-28T00:00:00.000Z')
  })

  it('coerceValue honours it too', () => {
    const v = coerceValue('2026-11-27T20:30:00Z', 'Asia/Jakarta') as Date
    expect(v.toISOString()).toBe('2026-11-28T03:30:00.000Z')
  })

  it('an unknown zone warns once and falls back to the browser zone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const at = new Date('2026-11-27T11:00:00Z')
    // New York is UTC-5 in November → 06:00.
    expect(toSheetDate(at, 'Asia/Jakartaa').toISOString()).toBe('2026-11-27T06:00:00.000Z')
    toSheetDate(at, 'Asia/Jakartaa')
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('{{date}} display text uses the same zone, so the day agrees across midnight', () => {
    const helpers = createHelpers({ locale: 'en-CA', timeZone: 'Asia/Jakarta' })
    const { text, directives } = extractDirectives(String(helpers.date!('2026-11-27T20:30:00Z', { hash: {} })))
    expect(text).toBe('2026-11-28') // Jakarta's date, not New York's 27th
    expect(directives[0]).toMatchObject({ k: 'val', d: '2026-11-27T20:30:00.000Z' })
  })
})
