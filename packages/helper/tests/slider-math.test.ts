// `<mono-slider>` value maths: pure functions, no DOM.
import { describe, it, expect } from 'vitest'

import {
  coerceNumbers,
  resolveScale,
  snap,
  normalise,
  moveThumb,
  moveRun,
  nearestThumb,
  isStacked,
  toPercent,
  fromRatio,
  trackPieces,
  markPoints,
  stepFrom,
  thumbBounds,
} from '../src/components/slider/slider-math'

const scale = (o: Record<string, unknown> = {}) => resolveScale(o)

describe('coerceNumbers', () => {
  it('reads numbers, arrays, JSON and comma strings', () => {
    expect(coerceNumbers(5)).toEqual([5])
    expect(coerceNumbers([20, '80'])).toEqual([20, 80])
    expect(coerceNumbers('[2,2,3]')).toEqual([2, 2, 3])
    expect(coerceNumbers('20, 80')).toEqual([20, 80])
    expect(coerceNumbers('7')).toEqual([7])
  })
  it('drops junk and returns null when nothing is left', () => {
    expect(coerceNumbers([1, 'x', NaN, 3])).toEqual([1, 3])
    expect(coerceNumbers('')).toBeNull()
    expect(coerceNumbers('[oops')).toBeNull()
    expect(coerceNumbers(undefined)).toBeNull()
  })
})

describe('resolveScale', () => {
  it('defaults to 0 / 100 / 1 and keeps max ≥ min', () => {
    expect(scale()).toMatchObject({ min: 0, max: 100, step: 1, stops: null, minGap: 0 })
    expect(scale({ min: 50, max: 10 })).toMatchObject({ min: 50, max: 50 })
  })
  it('step 0 is continuous; stops are sorted, de-duplicated and clipped', () => {
    expect(scale({ step: 0 }).step).toBe(0)
    expect(scale({ stops: '[50, 0, 25, 25, 500]' }).stops).toEqual([0, 25, 50])
  })
})

describe('snap', () => {
  it('snaps to the grid without float noise, and never past max', () => {
    expect(snap(0.3, scale({ max: 1, step: 0.1 }))).toBe(0.3)
    expect(snap(0.1 + 0.2, scale({ max: 1, step: 0.1 }))).toBe(0.3)
    expect(snap(99, scale({ max: 100, step: 7 }))).toBe(98)
    expect(snap(-5, scale())).toBe(0)
  })
  it('snaps to the nearest stop', () => {
    const s = scale({ stops: [0, 10, 25, 50, 100] })
    expect(snap(17, s)).toBe(10)
    expect(snap(18, s)).toBe(25)
    expect(snap(90, s)).toBe(100)
  })
  it('is continuous with step 0', () => {
    expect(snap(33.333, scale({ step: 0 }))).toBe(33.333)
  })
})

describe('normalise', () => {
  it('sorts and snaps', () => {
    expect(normalise([80, 20.4], scale())).toEqual([20, 80])
  })
  it('keeps stacked thumbs when there is no gap', () => {
    expect(normalise([2, 2, 3], scale())).toEqual([2, 2, 3])
  })
  it('spreads thumbs to the min gap, packing against max when they do not fit', () => {
    expect(normalise([10, 12], scale({ minGap: 5 }))).toEqual([10, 15])
    expect(normalise([98, 99, 100], scale({ minGap: 5 }))).toEqual([90, 95, 100])
  })
  it('respects stops while spreading', () => {
    expect(normalise([10, 10], scale({ stops: [0, 10, 25, 50], minGap: 5 }))).toEqual([10, 25])
  })
})

describe('moveThumb (the BLOCK rule)', () => {
  const s = scale()
  it('moves within the neighbours and returns a new array', () => {
    const v = [20, 80]
    const next = moveThumb(v, 0, 40, s)
    expect(next).toEqual([40, 80])
    expect(next).not.toBe(v)
  })
  it('stops at the neighbour (thumbs never cross)', () => {
    expect(moveThumb([20, 80], 0, 95, s)).toEqual([80, 80])
    expect(moveThumb([20, 80], 1, 5, s)).toEqual([20, 20])
  })
  it('stops at the neighbour minus the min gap', () => {
    expect(moveThumb([20, 80], 0, 95, scale({ minGap: 10 }))).toEqual([70, 80])
  })
  it('returns the SAME array when nothing moved', () => {
    const v = [20, 80]
    expect(moveThumb(v, 0, 20.2, s)).toBe(v)
    expect(moveThumb([80, 80], 0, 95, s)).toEqual([80, 80])
  })
  it('thumbBounds reports the allowed range', () => {
    expect(thumbBounds([10, 50, 90], 1, scale({ minGap: 5 }))).toEqual({ lo: 15, hi: 85 })
  })
})

describe('moveRun (segment drag)', () => {
  it('moves both thumbs, keeping their distance', () => {
    expect(moveRun([20, 40], 0, 1, 10, scale())).toEqual([30, 50])
  })
  it('stops at the track ends', () => {
    expect(moveRun([20, 40], 0, 1, 90, scale())).toEqual([80, 100])
    expect(moveRun([20, 40], 0, 1, -90, scale())).toEqual([0, 20])
  })
  it('stops at a thumb outside the run', () => {
    expect(moveRun([10, 20, 40], 1, 2, -50, scale({ minGap: 5 }))).toEqual([10, 15, 35])
  })
})

describe('nearestThumb', () => {
  it('picks the nearest thumb', () => {
    expect(nearestThumb([20, 80], 30)).toBe(0)
    expect(nearestThumb([20, 80], 70)).toBe(1)
  })
  it('splits a stack by the side of the press', () => {
    // [2, 2, 3]: thumbs 0 and 1 share 2
    expect(nearestThumb([2, 2, 3], 2.4)).toBe(1)
    expect(nearestThumb([2, 2, 3], 1)).toBe(0)
  })
  it('uses the drag direction for an exact hit on a stack', () => {
    expect(nearestThumb([2, 2, 3], 2, 1)).toBe(1)
    expect(nearestThumb([2, 2, 3], 2, -1)).toBe(0)
    expect(isStacked([2, 2, 3], 0)).toBe(true)
    expect(isStacked([2, 2, 3], 2)).toBe(false)
  })
})

describe('percent conversions', () => {
  it('maps values to 0–100 and back', () => {
    const s = scale({ min: -50, max: 50 })
    expect(toPercent(0, s)).toBe(50)
    expect(fromRatio(0.25, s)).toBe(-25)
    expect(toPercent(5, scale({ min: 5, max: 5 }))).toBe(0)
  })
})

describe('trackPieces', () => {
  const s = scale()
  it('one thumb with auto fill: min → thumb is filled', () => {
    const p = trackPieces([30], s, 'auto')
    expect(p.map((x) => [x.from, x.to, x.filled])).toEqual([[0, 30, true], [30, 100, false]])
    expect(p[0]).toMatchObject({ cutStart: false, cutEnd: true })
  })
  it('several thumbs with auto fill: every inner piece is filled', () => {
    const p = trackPieces([10, 40, 70], s, 'auto')
    expect(p.map((x) => x.filled)).toEqual([false, true, true, false])
  })
  it('start / end / none', () => {
    expect(trackPieces([20, 80], s, 'start').map((x) => x.filled)).toEqual([true, false, false])
    expect(trackPieces([20, 80], s, 'end').map((x) => x.filled)).toEqual([false, false, true])
    expect(trackPieces([20, 80], s, 'none').every((x) => !x.filled)).toBe(true)
  })
})

describe('markPoints', () => {
  it('true = one per step, or one per stop', () => {
    expect(markPoints(true, scale({ max: 4 })).map((m) => m.value)).toEqual([0, 1, 2, 3, 4])
    expect(markPoints('true', scale({ stops: [0, 30, 100] })).map((m) => m.value)).toEqual([0, 30, 100])
  })
  it('a dense grid falls back to the two ends', () => {
    expect(markPoints(true, scale({ max: 1000 })).map((m) => m.value)).toEqual([0, 1000])
    expect(markPoints(true, scale()).map((m) => m.value)).toEqual([0, 100])
    expect(markPoints(true, scale({ step: 5 })).length).toBe(21)
  })
  it('a list of numbers or labelled objects, sorted and clipped', () => {
    const m = markPoints([{ value: 100, label: 'Max' }, 0, 50, 500], scale())
    expect(m.map((x) => [x.value, x.pct, x.label, x.labelled])).toEqual([
      [0, 0, undefined, false],
      [50, 50, undefined, false],
      [100, 100, 'Max', true],
    ])
  })
  it('false / empty = none', () => {
    expect(markPoints(false, scale())).toEqual([])
    expect(markPoints('', scale())).toEqual([])
  })
})

describe('stepFrom (keyboard)', () => {
  it('a step, or ten with PageUp/Down', () => {
    expect(stepFrom(20, 1, false, scale({ step: 5 }))).toBe(25)
    expect(stepFrom(20, -1, true, scale({ step: 5 }))).toBe(-30)
  })
  it('walks the stops', () => {
    const s = scale({ stops: [0, 10, 25, 50, 100] })
    expect(stepFrom(10, 1, false, s)).toBe(25)
    expect(stepFrom(10, -1, false, s)).toBe(0)
    expect(stepFrom(100, 1, false, s)).toBe(100)
    expect(stepFrom(17, 1, false, s)).toBe(25)
  })
  it('continuous moves 1%', () => {
    expect(stepFrom(50, 1, false, scale({ step: 0 }))).toBe(51)
  })
})
