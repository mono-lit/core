// @vitest-environment jsdom
//
// `<mono-table-th width="auto">` — a column sized to its content, clamped to `min-width` /
// `max-width`, under `table-layout: fixed` where CSS `auto` cannot do it.
//
// Drives `ColumnAutoSize` (what the element hands an `'auto'` column to) straight from source:
// under this environment lit resolves its node build, where `isServer` is true and the element's
// `updated()` never touches its cell. The host stands in for the element — a label span is all the
// sizer reads from it.
//
// jsdom has no canvas, so the measurer is swapped for a flat 10px per character: the assertions
// are then about WHAT is measured (header, body, footer, editors; never a spacer row) and WHERE
// the width lands (`<col>` + `<th>`), not about font metrics.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  autosizeEnv,
  ColumnAutoSize,
  clampWidth,
  cssLengthToPx,
  headerColumnIndex,
  measureStyled,
} from '../src/components/table/column-autosize'
import { startMonoSizeAttributes } from '../src/composables/mono-size-attrs'

const tick = (ms = 50) => new Promise((r) => setTimeout(r, ms))

describe('column-autosize helpers', () => {
  it('converts lengths to px', () => {
    expect(cssLengthToPx(90)).toBe(90)
    expect(cssLengthToPx('90')).toBe(90)
    expect(cssLengthToPx('90px')).toBe(90)
    expect(cssLengthToPx('6rem')).toBe(96)
    expect(cssLengthToPx('40%')).toBeUndefined()
    expect(cssLengthToPx(null)).toBeUndefined()
  })

  it('clamps, min winning over a smaller max', () => {
    expect(clampWidth(50, 80, 200)).toBe(80)
    expect(clampWidth(300, 80, 200)).toBe(200)
    expect(clampWidth(120)).toBe(120)
    expect(clampWidth(10, 100, 50)).toBe(100)
  })

  it('maps a leaf header under a band row to its real column', () => {
    const table = document.createElement('table')
    table.innerHTML = `<thead>
      <tr><th rowspan="2">COA</th><th colspan="3">Jan</th><th rowspan="2">Total</th></tr>
      <tr><th>Budget</th><th>Input</th><th id="sisa">Sisa</th></tr>
    </thead>`
    const sisa = table.querySelector('#sisa') as HTMLTableCellElement
    const total = table.querySelectorAll('th')[2] as HTMLTableCellElement
    expect(headerColumnIndex(sisa)).toBe(3)
    expect(headerColumnIndex(total)).toBe(4)
  })
})

describe('ColumnAutoSize', () => {
  const realMeasure = autosizeEnv.measure
  beforeEach(() => {
    autosizeEnv.measure = (text) => text.length * 10
  })
  afterEach(() => {
    autosizeEnv.measure = realMeasure
    document.body.innerHTML = ''
  })

  function mount(body: string[], foot?: string) {
    const table = document.createElement('table')
    table.innerHTML = `
      <colgroup><col><col></colgroup>
      <thead><tr><th>Name</th><th><div class="host"><span data-mono-slot="label">JAN</span></div></th></tr></thead>
      <tbody>
        <tr class="spacer"><td colspan="2">${'x'.repeat(80)}</td></tr>
        ${body.map((v) => `<tr><td>row</td><td>${v}</td></tr>`).join('')}
      </tbody>
      ${foot != null ? `<tfoot><tr><td></td><td>${foot}</td></tr></tfoot>` : ''}`
    document.body.appendChild(table)
    const sizer = new ColumnAutoSize(table.querySelector('.host') as HTMLElement)
    const width = () => ({
      col: (table.querySelectorAll('col')[1] as HTMLElement).style.width,
      th: (table.querySelectorAll('th')[1] as HTMLElement).style.width,
    })
    return { table, sizer, width }
  }

  it('sizes to the widest cell — the footer included, the spacer row not', async () => {
    const { sizer, width } = mount(['0', '1.000'], '1.234.567')
    sizer.schedule()
    await tick()
    // 9 chars × 10 + 1px sub-pixel slack (jsdom cells have no padding).
    expect(width()).toEqual({ col: '91px', th: '91px' })
    sizer.stop()
  })

  it('is as narrow as the header when every figure is 0', async () => {
    const { sizer, width } = mount(['0', '0'])
    sizer.schedule()
    await tick()
    expect(width().col).toBe('31px') // "JAN"
    sizer.stop()
  })

  it('clamps to min and max', async () => {
    const a = mount(['0'])
    a.sizer.min = 90
    a.sizer.schedule()
    await tick()
    expect(a.width().col).toBe('90px')
    a.sizer.stop()
    document.body.innerHTML = ''

    const b = mount(['1.234.567.890.123'])
    b.sizer.max = 120
    b.sizer.schedule()
    await tick()
    expect(b.width().col).toBe('120px')
    b.sizer.stop()
  })

  it('counts an editor by its value, and skips a v-show-hidden one', async () => {
    const { table, sizer, width } = mount(['<input style="padding:0;border:0" value="12.345.678">', '<input style="display:none" value="9999999999999999">'])
    sizer.schedule()
    await tick()
    expect(width().col).toBe('101px')
    sizer.stop()
    void table
  })

  it('re-measures when the rows change, and hands the width back on stop(true)', async () => {
    const { table, sizer, width } = mount(['0'])
    sizer.schedule()
    await tick()
    expect(width().col).toBe('31px')

    table.tBodies[0]!.rows[1]!.cells[1]!.textContent = '9.999.999'
    await tick()
    expect(width().col).toBe('91px')

    sizer.stop(true)
    expect(width()).toEqual({ col: '', th: '' })
  })
})

describe('mono-width / mono-min-width / mono-max-width attributes', () => {
  const realMeasure = autosizeEnv.measure
  let stop: () => void = () => {}
  beforeEach(() => {
    autosizeEnv.measure = (text) => text.length * 10
    stop = startMonoSizeAttributes()
  })
  afterEach(() => {
    stop()
    autosizeEnv.measure = realMeasure
    document.body.innerHTML = ''
  })

  it('sizes a plain <th mono-width="auto"> column, clamped', async () => {
    document.body.innerHTML = `<table>
      <colgroup><col><col></colgroup>
      <thead><tr><th>Name</th><th mono-width="auto" mono-min-width="10" mono-max-width="80">JAN</th></tr></thead>
      <tbody><tr><td>a</td><td>1.000</td></tr></tbody>
      <tfoot><tr><td></td><td>1.234.567.890</td></tr></tfoot>
    </table>`
    await tick()
    const col = document.querySelectorAll('col')[1] as HTMLElement
    expect(col.style.width).toBe('80px') // the 13-char footer, capped
    expect((document.querySelectorAll('th')[1] as HTMLElement).style.maxWidth).toBe('80px')
  })

  it('follows a changed attribute: auto → fixed hands the column back', async () => {
    document.body.innerHTML = `<table>
      <colgroup><col></colgroup>
      <thead><tr><th mono-width="auto">JAN</th></tr></thead>
      <tbody><tr><td>12.345</td></tr></tbody>
    </table>`
    await tick()
    const th = document.querySelector('th') as HTMLElement
    const col = document.querySelector('col') as HTMLElement
    expect(col.style.width).toBe('61px')

    th.setAttribute('mono-width', '150')
    await tick()
    expect(th.style.width).toBe('150px')
    expect(col.style.width).toBe('')
  })

  it('is plain CSS on any other element', async () => {
    document.body.innerHTML = `<div mono-width="auto" mono-min-width="10rem" mono-max-width="300"></div>
      <div mono-width="240"></div>`
    await tick()
    const [a, b] = Array.from(document.querySelectorAll('div')) as HTMLElement[]
    // `auto` → `fit-content`, which jsdom's CSS parser rejects (browsers take it) — not asserted.
    expect(a!.style.minWidth).toBe('10rem')
    expect(a!.style.maxWidth).toBe('300px')
    expect(b!.style.width).toBe('240px')
  })
})

describe('measureStyled — what canvas cannot be told', () => {
  const realMeasure = autosizeEnv.measure
  const fonts: string[] = []
  beforeEach(() => {
    fonts.length = 0
    // Digits 10px, "9" the widest at 12px (a tabular advance), everything else 5px.
    autosizeEnv.measure = (text, font) => {
      fonts.push(font)
      return [...text].reduce((w, ch) => w + (ch === '9' ? 12 : /\d/.test(ch) ? 10 : 5), 0)
    }
  })
  afterEach(() => {
    autosizeEnv.measure = realMeasure
  })

  const style = (s: Partial<CSSStyleDeclaration>) =>
    ({ fontStyle: 'normal', fontWeight: '600', fontSize: '14px', fontFamily: 'Inter, sans-serif', ...s }) as CSSStyleDeclaration

  it('never hands canvas a font with tabular-nums in it (the empty-shorthand regression)', () => {
    // A computed style with `font-variant-numeric` set serialises `font` to '' — the old code then
    // fed `fontVariant` ("tabular-nums") to canvas, which rejected the whole string.
    measureStyled('10.725', style({ font: '', fontVariant: 'tabular-nums', fontVariantNumeric: 'tabular-nums' }))
    expect(fonts.every((f) => f === 'normal 600 14px Inter, sans-serif')).toBe(true)
  })

  it('sizes tabular digits at the widest digit', () => {
    // "10.725": 5 digits × 12 (widest) + "." 5 — wider than the proportional 10+10+5+10+10+10.
    const tab = measureStyled('10.725', style({ fontVariantNumeric: 'tabular-nums' }))
    const prop = measureStyled('10.725', style({ fontVariantNumeric: 'normal' }))
    expect(tab).toBe(65)
    expect(prop).toBe(55)
  })

  it('applies text-transform and letter-spacing', () => {
    expect(measureStyled('ab', style({ letterSpacing: '1.5px' }))).toBe(13)
    expect(measureStyled('jan', style({ textTransform: 'uppercase' }))).toBe(15)
  })
})
