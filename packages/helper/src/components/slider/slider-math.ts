/**
 * `<mono-slider>` value maths — PURE and DOM-free, so every rule here is cheap to test.
 *
 * A slider value is a sorted list of thumb positions on a SCALE: `[min, max]`, snapped to either a
 * `step` grid or an explicit list of `stops`, with at least `minGap` between neighbours. Thumbs
 * BLOCK each other (a dragged thumb stops at its neighbour, minus the gap), so the order never
 * changes and `values[i]` always means "thumb i".
 */

import type { SliderFill, SliderMark } from './slider-types.js'

export interface SliderScale {
  min: number
  max: number
  /** Snap interval; 0 = continuous. Ignored when `stops` is set. */
  step: number
  /** Sorted, de-duplicated, inside [min, max]; null when the slider snaps to `step`. */
  stops: number[] | null
  minGap: number
}

export interface SliderScaleInput {
  min?: unknown
  max?: unknown
  step?: unknown
  stops?: unknown
  minGap?: unknown
}

/** One stretch of track between two boundaries (the ends, or a thumb). */
export interface SliderPiece {
  /** Start / end along the track, 0–100. */
  from: number
  to: number
  /** True when that end is a THUMB (so a `track-gap` cuts it back), false at the track's ends. */
  cutStart: boolean
  cutEnd: boolean
  filled: boolean
}

export interface SliderMarkPoint {
  value: number
  /** 0–100 along the track. */
  pct: number
  /** The mark's own label; undefined means "format the value" (when labels are shown at all). */
  label?: string
  /** True when the mark carried a label (or was given as an object). */
  labelled: boolean
}

/** Past this many grid ticks, `marks` = true draws only the ends: denser than this reads as a texture. */
const MAX_AUTO_MARKS = 26

/** Strip float noise (0.1 + 0.2) without losing a fractional step. */
export function stripNoise(n: number): number {
  return Number(n.toFixed(10))
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Anything a consumer (or a framework) might hand over as a value — a number, an array, a JSON
 * string (`"[20,80]"`, what an SSR attribute carries), a comma list (`"20,80"`), a numeric string —
 * as a list of finite numbers. Non-numbers are dropped. `null` when nothing usable is left.
 */
export function coerceNumbers(value: unknown): number[] | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? [value] : null
  if (Array.isArray(value)) {
    const out = value.map(toNumber).filter((n): n is number => n !== undefined)
    return out.length ? out : null
  }
  if (typeof value === 'string') {
    const text = value.trim()
    if (text.startsWith('[')) {
      try {
        return coerceNumbers(JSON.parse(text))
      } catch {
        return null
      }
    }
    if (text.includes(',')) return coerceNumbers(text.split(','))
    const n = toNumber(text)
    return n === undefined ? null : [n]
  }
  return null
}

/** The scale from raw props: defaults 0 / 100 / 1, `max` never below `min`, stops cleaned. */
export function resolveScale(input: SliderScaleInput): SliderScale {
  const min = toNumber(input.min) ?? 0
  const rawMax = toNumber(input.max) ?? 100
  const max = rawMax < min ? min : rawMax
  const rawStep = toNumber(input.step)
  const step = rawStep === undefined ? 1 : rawStep > 0 ? rawStep : 0
  const minGap = Math.max(0, toNumber(input.minGap) ?? 0)

  const list = coerceNumbers(input.stops)
  const stops = list
    ? [...new Set(list.filter((n) => n >= min && n <= max).map(stripNoise))].sort((a, b) => a - b)
    : null

  return { min, max, step, stops: stops && stops.length ? stops : null, minGap }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/** The allowed value nearest to `v` (a stop, a grid point, or `v` itself when continuous). */
export function snap(v: number, scale: SliderScale): number {
  const x = clamp(v, scale.min, scale.max)
  if (scale.stops) {
    let best = scale.stops[0]
    for (const s of scale.stops) if (Math.abs(s - x) < Math.abs(best - x)) best = s
    return best
  }
  if (!scale.step) return stripNoise(x)
  const snapped = scale.min + Math.round((x - scale.min) / scale.step) * scale.step
  // A grid that does not divide the span evenly can round past `max`.
  return stripNoise(snapped > scale.max ? snapped - scale.step : snapped)
}

/** The smallest allowed value ≥ x (or `max` when none is). */
export function ceilTo(x: number, scale: SliderScale): number {
  if (x <= scale.min) return scale.min
  if (scale.stops) return scale.stops.find((s) => s >= x - 1e-9) ?? scale.max
  if (!scale.step) return Math.min(x, scale.max)
  const v = scale.min + Math.ceil(stripNoise((x - scale.min) / scale.step)) * scale.step
  return stripNoise(v > scale.max ? scale.max : v)
}

/** The largest allowed value ≤ x (or `min` when none is). */
export function floorTo(x: number, scale: SliderScale): number {
  if (x >= scale.max) return scale.stops ? scale.stops[scale.stops.length - 1] : snapFloorMax(scale)
  if (scale.stops) {
    for (let i = scale.stops.length - 1; i >= 0; i--) if (scale.stops[i] <= x + 1e-9) return scale.stops[i]
    return scale.min
  }
  if (!scale.step) return Math.max(x, scale.min)
  const v = scale.min + Math.floor(stripNoise((x - scale.min) / scale.step)) * scale.step
  return stripNoise(v < scale.min ? scale.min : v)
}

/** The highest grid point (equals `max` only when the step divides the span). */
function snapFloorMax(scale: SliderScale): number {
  if (!scale.step) return scale.max
  return stripNoise(scale.min + Math.floor(stripNoise((scale.max - scale.min) / scale.step)) * scale.step)
}

/**
 * The values, made valid: each clamped and snapped, sorted, then spread so neighbours are at least
 * `minGap` apart. Thumbs are never dropped — when the gap cannot fit every thumb, they pack
 * against the ends (the forward pass pushes right, the backward pass pulls back under `max`).
 */
export function normalise(values: number[], scale: SliderScale): number[] {
  const out = values.map((v) => snap(v, scale)).sort((a, b) => a - b)
  if (!scale.minGap || out.length < 2) return out
  for (let i = 1; i < out.length; i++) {
    if (out[i] - out[i - 1] < scale.minGap - 1e-9) out[i] = ceilTo(out[i - 1] + scale.minGap, scale)
  }
  for (let i = out.length - 2; i >= 0; i--) {
    if (out[i + 1] - out[i] < scale.minGap - 1e-9) out[i] = floorTo(out[i + 1] - scale.minGap, scale)
  }
  return out.map((v) => clamp(v, scale.min, scale.max))
}

/** The range thumb `i` may move in: its neighbours ± `minGap` (the BLOCK rule). */
export function thumbBounds(values: number[], i: number, scale: SliderScale): { lo: number; hi: number } {
  const lo = i > 0 ? ceilTo(values[i - 1] + scale.minGap, scale) : scale.min
  const hi = i < values.length - 1 ? floorTo(values[i + 1] - scale.minGap, scale) : snapFloorMaxOrStop(scale)
  return { lo, hi: Math.max(lo, hi) }
}

function snapFloorMaxOrStop(scale: SliderScale): number {
  return scale.stops ? scale.stops[scale.stops.length - 1] : snapFloorMax(scale)
}

function snapFloorMinOrStop(scale: SliderScale): number {
  return scale.stops ? scale.stops[0] : scale.min
}

/**
 * Move thumb `i` toward `v`: snap, then stop at the neighbours (± gap). Returns a NEW array when
 * the thumb actually moved, the SAME array otherwise — callers use identity to skip no-op events.
 */
export function moveThumb(values: number[], i: number, v: number, scale: SliderScale): number[] {
  const { lo, hi } = thumbBounds(values, i, scale)
  const next = clamp(snap(v, scale), lo, hi)
  if (next === values[i]) return values
  const out = values.slice()
  out[i] = next
  return out
}

/**
 * Shift a whole run of thumbs `[from..to]` by `delta`, keeping their spacing — the drag of a filled
 * segment between two thumbs. The run stops at the track ends and at the thumbs outside it.
 */
export function moveRun(values: number[], from: number, to: number, delta: number, scale: SliderScale): number[] {
  const lo = from > 0 ? values[from - 1] + scale.minGap : snapFloorMinOrStop(scale)
  const hi = to < values.length - 1 ? values[to + 1] - scale.minGap : snapFloorMaxOrStop(scale)
  const d = clamp(delta, lo - values[from], hi - values[to])
  if (!d) return values
  // Snap the run as a whole on its first thumb, so the spacing is preserved exactly.
  const anchor = snap(values[from] + d, scale)
  const applied = clamp(anchor - values[from], lo - values[from], hi - values[to])
  if (!applied) return values
  const out = values.slice()
  for (let k = from; k <= to; k++) out[k] = stripNoise(values[k] + applied)
  return out
}

/**
 * The thumb a press at `v` should grab: the nearest one. Thumbs sitting on the same spot (`[2, 2,
 * 3]`) tie — then the press picks by SIDE: a press above the stack takes its LAST thumb, below it
 * the FIRST, so stacked thumbs can always be pulled apart. `dir` (+1 / -1) breaks an exact hit,
 * once the drag has shown which way it is heading.
 */
export function nearestThumb(values: number[], v: number, dir = 0): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < values.length; i++) {
    const d = Math.abs(values[i] - v)
    if (d < bestDist - 1e-9) {
      best = i
      bestDist = d
    }
  }
  // Widen to the whole stack that shares the winning position.
  let first = best
  let last = best
  while (first > 0 && Math.abs(values[first - 1] - values[best]) < 1e-9) first--
  while (last < values.length - 1 && Math.abs(values[last + 1] - values[best]) < 1e-9) last++
  if (first === last) return best
  const side = v > values[best] + 1e-9 ? 1 : v < values[best] - 1e-9 ? -1 : dir
  return side > 0 ? last : first
}

/** True when several thumbs share position `values[i]` (a stack the next drag must split). */
export function isStacked(values: number[], i: number): boolean {
  return (i > 0 && Math.abs(values[i - 1] - values[i]) < 1e-9) ||
    (i < values.length - 1 && Math.abs(values[i + 1] - values[i]) < 1e-9)
}

/** `v` as a 0–100 position along the track. */
export function toPercent(v: number, scale: SliderScale): number {
  const span = scale.max - scale.min
  if (span <= 0) return 0
  return clamp(((v - scale.min) / span) * 100, 0, 100)
}

/** A 0–1 position along the track as a raw (unsnapped) value. */
export function fromRatio(ratio: number, scale: SliderScale): number {
  return scale.min + clamp(ratio, 0, 1) * (scale.max - scale.min)
}

/**
 * The track as pieces between its boundaries (the two ends and every thumb), each flagged filled
 * or not by the `fill` mode. Rendering every stretch as its own piece is what lets `track-gap` cut
 * the track back around each thumb, and lets a consumer colour segments one by one.
 */
export function trackPieces(values: number[], scale: SliderScale, fill: SliderFill): SliderPiece[] {
  const pcts = values.map((v) => toPercent(v, scale))
  const bounds = [0, ...pcts, 100]
  const n = values.length
  const pieces: SliderPiece[] = []
  for (let k = 0; k < bounds.length - 1; k++) {
    // piece k runs from bound k to bound k+1; bounds 1..n are thumbs
    let filled = false
    if (fill === 'start') filled = k === 0
    else if (fill === 'end') filled = k === n
    else if (fill === 'auto') filled = n === 1 ? k === 0 : k >= 1 && k <= n - 1
    pieces.push({ from: bounds[k], to: bounds[k + 1], cutStart: k > 0, cutEnd: k < n, filled })
  }
  return pieces
}

/** The marks to draw. `true` = one per stop, or per step (only the two ends past ~26 — denser is a texture, not ticks). */
export function markPoints(marks: unknown, scale: SliderScale): SliderMarkPoint[] {
  if (marks === false || marks === null || marks === undefined || marks === '' || marks === 'false') return []
  let list: unknown = marks
  if (typeof marks === 'string') {
    const text = marks.trim()
    if (text === 'true') list = true
    else {
      try {
        list = JSON.parse(text)
      } catch {
        list = coerceNumbers(text) ?? []
      }
    }
  }

  if (list === true) {
    const values = scale.stops ?? autoGrid(scale)
    return values.map((value) => ({ value, pct: toPercent(value, scale), labelled: false }))
  }
  if (!Array.isArray(list)) return []

  const out: SliderMarkPoint[] = []
  for (const item of list as SliderMark[]) {
    if (typeof item === 'number' || typeof item === 'string') {
      const value = toNumber(item)
      if (value !== undefined && value >= scale.min && value <= scale.max) {
        out.push({ value, pct: toPercent(value, scale), labelled: false })
      }
    } else if (item && typeof item === 'object') {
      const value = toNumber((item as { value: unknown }).value)
      if (value !== undefined && value >= scale.min && value <= scale.max) {
        const label = (item as { label?: unknown }).label
        out.push({ value, pct: toPercent(value, scale), label: label == null ? undefined : String(label), labelled: true })
      }
    }
  }
  return out.sort((a, b) => a.value - b.value)
}

function autoGrid(scale: SliderScale): number[] {
  if (!scale.step) return [scale.min, scale.max]
  const count = Math.floor(stripNoise((scale.max - scale.min) / scale.step)) + 1
  if (count > MAX_AUTO_MARKS) return [scale.min, scale.max]
  return Array.from({ length: count }, (_, i) => stripNoise(scale.min + i * scale.step))
}

/**
 * One keyboard step from `v`: `dir` ±1, `big` for PageUp/PageDown. With stops it walks the list
 * (big = a tenth of it, at least one); with a grid it moves a step (big = ten); continuous moves
 * 1% (big = 10%).
 */
export function stepFrom(v: number, dir: 1 | -1, big: boolean, scale: SliderScale): number {
  if (scale.stops) {
    const stops = scale.stops
    let idx = stops.findIndex((s) => Math.abs(s - v) < 1e-9)
    if (idx < 0) idx = stops.findIndex((s) => s > v) - (dir > 0 ? 1 : 0)
    const jump = big ? Math.max(1, Math.round(stops.length / 10)) : 1
    return stops[clamp(idx + dir * jump, 0, stops.length - 1)]
  }
  const unit = scale.step || (scale.max - scale.min) / 100
  return stripNoise(v + dir * unit * (big ? 10 : 1))
}
