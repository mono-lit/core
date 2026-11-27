/**
 * Dates for the Excel writer, in a chosen time zone.
 *
 * ExcelJS turns a Date into a sheet serial from its UTC fields, and a sheet cell has no time
 * zone. So the Date handed to it must carry the wall-clock time we want SHOWN in its UTC fields.
 * Left as-is, a timestamp the page shows as 18:00 in UTC+7 (11:00Z) is written as 11:00.
 *
 * `formatting.timeZone` picks the zone (`'Asia/Jakarta'`); without it, the browser's own.
 */
import { dateTimeFormat } from '../utils/intl-cache'

const warned = new Set<string>()

/**
 * Is `timeZone` a zone this runtime knows? An unknown one warns ONCE per name and reads as
 * "not set", so a typo falls back to the browser's zone instead of failing every export.
 */
export function validTimeZone(timeZone: string | undefined): timeZone is string {
  if (!timeZone) return false
  try {
    dateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    if (!warned.has(timeZone)) {
      warned.add(timeZone)
      console.warn(`[mono-export] unknown timeZone "${timeZone}" — using the browser's time zone.`)
    }
    return false
  }
}

/**
 * The Date to hand ExcelJS so the sheet shows the wall-clock time of `date` in `timeZone`
 * (or the browser's zone when that is unset or unknown). The offset is the one in force AT that
 * date, so a DST zone gets each row's own.
 */
export function toSheetDate(date: Date, timeZone?: string): Date {
  if (!validTimeZone(timeZone)) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  }

  // `hour12: false`, NOT the `hourCycle` option: UnoCSS scans this source for class names and
  // turned that option's string value into a stray utility rule in ui/index.css. The `% 24`
  // below covers engines that print midnight as `24` under `hour12: false`.
  const parts = dateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)

  return new Date(Date.UTC(
    get('year'), get('month') - 1, get('day'),
    get('hour') % 24, get('minute'), get('second'), date.getUTCMilliseconds(),
  ))
}
