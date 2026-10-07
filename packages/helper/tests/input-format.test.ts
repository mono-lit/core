// @vitest-environment jsdom
//
// `<mono-input>` formatting — the pattern dialect and the caret maths.
//
// Two layers are tested separately on purpose. The pure functions in `input-format.ts` carry all
// the fiddly rules (trailing separators, precision clamping, caret mapping) and are cheap to pin
// down exhaustively; the element test then only has to prove the wiring, not re-test the grammar.
//
// The element half drives the BUILT artifact (`dist/ui/input.js`), so it exercises exactly what a
// consumer installs — same arrangement as `tag-input.test.ts`.
import { describe, it, expect, beforeAll } from 'vitest'

import {
  applyFormat,
  caretAfterFormat,
  localeSeparators,
  normaliseValue,
  parseFormat,
  significantFor,
  stripFormat,
} from '../src/components/input/input-format'

const ID = 'id-ID'
const US = 'en-US'

describe('parseFormat', () => {
  it('reads the number grammar', () => {
    expect(parseFormat('#,##0')).toMatchObject({ kind: 'number', grouping: true, minFraction: 0, maxFraction: 0 })
    expect(parseFormat('#,##0.##')).toMatchObject({ kind: 'number', grouping: true, minFraction: 0, maxFraction: 2 })
    expect(parseFormat('#,##0.00')).toMatchObject({ kind: 'number', grouping: true, minFraction: 2, maxFraction: 2 })
    expect(parseFormat('0')).toMatchObject({ kind: 'number', grouping: false })
  })

  it('accepts the bare-grouping form the app already uses', () => {
    // `,##0` appears three times in esw-project and DevExtreme treats it as `#,##0`.
    expect(parseFormat(',##0')).toMatchObject({ kind: 'number', grouping: true })
  })

  it('pulls quoted literals off either end', () => {
    expect(parseFormat('"Rp"#,##0')).toMatchObject({ prefix: 'Rp', suffix: '' })
    expect(parseFormat('#,##0" kg"')).toMatchObject({ prefix: '', suffix: ' kg' })
  })

  it('treats a pattern containing {} as a template', () => {
    expect(parseFormat('{}@gmail.com')).toEqual({ kind: 'template', before: '', after: '@gmail.com' })
    expect(parseFormat('+62 {}')).toEqual({ kind: 'template', before: '+62 ', after: '' })
  })

  it('returns null for nonsense rather than throwing', () => {
    expect(parseFormat('')).toBeNull()
    expect(parseFormat('not a pattern')).toBeNull()
    expect(parseFormat('#.#.#')).toBeNull()
  })
})

describe('applyFormat — numbers', () => {
  const money = parseFormat('#,##0.##')!

  it('groups with the LOCALE characters, not the pattern ones', () => {
    expect(applyFormat('10000000', money, ID)).toBe('10.000.000')
    expect(applyFormat('10000000', money, US)).toBe('10,000,000')
  })

  it('keeps a decimal point the user has typed but not filled', () => {
    // Without this the separator is impossible to type: it would be stripped on every keystroke.
    expect(applyFormat('10000.', money, ID)).toBe('10.000,')
  })

  it('keeps trailing fraction zeros while typing', () => {
    expect(applyFormat('10.50', money, ID)).toBe('10,50')
  })

  it('clamps the fraction to the pattern ceiling', () => {
    expect(applyFormat('1.239', money, US)).toBe('1.23')
  })

  it('pads to the floor only on commit', () => {
    const padded = parseFormat('#,##0.00')!
    expect(applyFormat('7', padded, US)).toBe('7')
    expect(applyFormat('7', padded, US, { pad: true })).toBe('7.00')
  })

  it('carries literals and the sign', () => {
    expect(applyFormat('-2500', parseFormat('"Rp"#,##0')!, ID)).toBe('Rp-2.500')
  })

  it('leaves an empty value empty', () => {
    expect(applyFormat('', money, ID)).toBe('')
  })
})

describe('stripFormat', () => {
  it('is the inverse of applyFormat under any locale', () => {
    const money = parseFormat('#,##0.##')!
    expect(stripFormat('10.000.000', money, ID)).toBe('10000000')
    expect(stripFormat('10,000,000', money, US)).toBe('10000000')
    expect(stripFormat('10.000,25', money, ID)).toBe('10000.25')
    expect(stripFormat('10,000.25', money, US)).toBe('10000.25')
  })

  it('survives a locale whose GROUP separator is the decimal point', () => {
    // id-ID groups with `.` — stripping in the wrong order would eat the decimal point too.
    expect(stripFormat('1.234.567,89', parseFormat('#,##0.##')!, ID)).toBe('1234567.89')
  })

  it('drops the fraction entirely for an integer pattern', () => {
    expect(stripFormat('1.234,56', parseFormat('#,##0')!, ID)).toBe('1234')
  })

  it('removes template literals', () => {
    expect(stripFormat('ada@gmail.com', parseFormat('{}@gmail.com')!, US)).toBe('ada')
  })
})

describe('normaliseValue', () => {
  const money = parseFormat('#,##0.##')!

  it('emits a plain numeric string Number() can read', () => {
    expect(normaliseValue('10000000.25', money)).toBe('10000000.25')
    expect(Number(normaliseValue('10000000.25', money))).toBe(10000000.25)
  })

  it('strips leading zeros', () => {
    expect(normaliseValue('007', money)).toBe('7')
  })

  it('assembles the whole string for a template — there the decoration IS the value', () => {
    expect(normaliseValue('ada', parseFormat('{}@gmail.com')!)).toBe('ada@gmail.com')
  })

  it('maps an empty value to empty, not to zero', () => {
    expect(normaliseValue('', money)).toBe('')
  })
})

describe('caretAfterFormat', () => {
  const money = parseFormat('#,##0.##')!
  const significant = significantFor(money, ID)

  it('keeps the caret against the digit it was behind when a separator appears', () => {
    // `prev` is the text the CARET INDEX refers to — the post-keystroke, pre-format value, which
    // is what `_applyDisplay` hands it. Typing "0" onto "1000" gives "10000" with the caret at 5;
    // formatting inserts a separator, so the caret has to move to 6 to stay after the same digit.
    expect(caretAfterFormat('10.000', 5, '10000', significant)).toBe(6)
  })

  it('does not throw the caret to the end when editing mid-number', () => {
    // "10.000.000" with the caret after the second digit; reformatting must not move it to 10.
    const caret = caretAfterFormat('10.000.000', 2, '10.000.000', significant)
    expect(caret).toBe(2)
  })

  it('parks before the first significant character when nothing precedes the caret', () => {
    const withPrefix = parseFormat('"Rp"#,##0')!
    expect(caretAfterFormat('Rp2.500', 0, '', significantFor(withPrefix, ID))).toBe(2)
  })
})

describe('localeSeparators', () => {
  it('reads the characters from Intl rather than assuming', () => {
    expect(localeSeparators(ID)).toEqual({ group: '.', decimal: ',' })
    expect(localeSeparators(US)).toEqual({ group: ',', decimal: '.' })
  })
})

// ── the element ──────────────────────────────────────────────────────────────────────────────

describe('<mono-input> formatting', () => {
  beforeAll(async () => {
    await import('../dist/ui/input.js')
  })

  const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown>): Promise<any> {
    const el = document.createElement('mono-input') as any
    document.body.appendChild(el)
    for (const [key, value] of Object.entries(props)) el[key] = value
    await tick()
    return el
  }

  async function type(el: any, text: string): Promise<void> {
    const native = el.querySelector('.mono-input-native') as HTMLInputElement
    native.value = text
    native.selectionStart = text.length
    native.dispatchEvent(new Event('input', { bubbles: true }))
    await tick()
  }

  it('shows the formatted text while reporting a normalised value', async () => {
    const el = await mount({
      type: 'text',
      formatDisplay: '#,##0.##',
      formatValue: '#,##0.##',
      formatLocale: ID,
    })

    await type(el, '10000000')

    expect((el.querySelector('.mono-input-native') as HTMLInputElement).value).toBe('10.000.000')
    expect(el.modelValue).toBe('10000000')
    expect(Number(el.modelValue)).toBe(10000000)
  })

  it('emits the display text alongside the value', async () => {
    const el = await mount({ type: 'text', formatDisplay: '#,##0', formatLocale: ID })

    let detail: any = null
    el.addEventListener('mno-input', (e: any) => { detail = e.detail })
    await type(el, '2500')

    expect(detail.modelValue).toBe('2500')
    expect(detail.displayValue).toBe('2.500')
  })

  it('applies a {} template', async () => {
    const el = await mount({ formatDisplay: '{}@gmail.com', formatValue: '{}@gmail.com' })
    await type(el, 'ada')

    expect((el.querySelector('.mono-input-native') as HTMLInputElement).value).toBe('ada@gmail.com')
    expect(el.modelValue).toBe('ada@gmail.com')
  })

  it('accepts the function form', async () => {
    const el = await mount({ formatDisplay: (ctx: any) => ctx.value.toUpperCase() })
    await type(el, 'ada')

    expect((el.querySelector('.mono-input-native') as HTMLInputElement).value).toBe('ADA')
  })

  it('leaves the text alone while typing when format-on is blur', async () => {
    const el = await mount({
      type: 'text',
      formatDisplay: '#,##0',
      formatOn: 'blur',
      formatLocale: ID,
    })

    await type(el, '10000')
    const native = el.querySelector('.mono-input-native') as HTMLInputElement
    expect(native.value).toBe('10000')

    native.dispatchEvent(new Event('change', { bubbles: true }))
    await tick()
    expect(native.value).toBe('10.000')
  })

  it('re-renders the display when the value arrives from outside', async () => {
    const el = await mount({ type: 'text', formatDisplay: '#,##0', formatLocale: ID })

    el.modelValue = '4200000'
    await tick()

    expect((el.querySelector('.mono-input-native') as HTMLInputElement).value).toBe('4.200.000')
  })

  // The markup form is a SEPARATE path from the property form: both props are `attribute: false`
  // (a function cannot cross an attribute), so Lit ignores the attribute and the element has to
  // route it by hand. It went unwired at first and every property-driven test still passed, so
  // these two exist to keep that gap closed.
  it('reads the formats from plain ATTRIBUTES', async () => {
    const el = document.createElement('mono-input') as any
    el.setAttribute('type', 'text')
    el.setAttribute('format-display', '#,##0')
    el.setAttribute('format-value', '#,##0')
    el.setAttribute('format-locale', ID)
    document.body.appendChild(el)
    await tick()

    await type(el, '2500000')

    expect((el.querySelector('.mono-input-native') as HTMLInputElement).value).toBe('2.500.000')
    expect(el.modelValue).toBe('2500000')
  })

  it('does not let an attribute clobber a function set through .prop', async () => {
    const el = document.createElement('mono-input') as any
    el.formatDisplay = (ctx: any) => `[${ctx.value}]`
    // Vue mirrors a non-primitive prop as its String() form; that must not win.
    el.setAttribute('format-display', '(ctx) => `[${ctx.value}]`')
    document.body.appendChild(el)
    await tick()

    expect(typeof el.formatDisplay).toBe('function')
    await type(el, 'ada')
    expect((el.querySelector('.mono-input-native') as HTMLInputElement).value).toBe('[ada]')
  })

  it('is an ordinary input when neither format prop is set', async () => {
    const el = await mount({})
    await type(el, '10000')

    expect((el.querySelector('.mono-input-native') as HTMLInputElement).value).toBe('10000')
    expect(el.modelValue).toBe('10000')
  })

  // ── typing into a field that starts at `0` ──
  //
  // A money field seeded with 0 used to append: typing 9 gave `09`, then `0999999`, while the
  // MODEL already read `999999` because `normaliseValue` canonicalised and `applyFormat` did not.
  const moneyProps = {
    type: 'text',
    formatDisplay: '#,##0.##',
    formatValue: '#,##0.##',
    formatLocale: ID,
  }

  const display = (el: any) => (el.querySelector('.mono-input-native') as HTMLInputElement).value

  it('drops a leading zero as you type over it', async () => {
    const el = await mount(moneyProps)
    await type(el, '09')

    expect(display(el)).toBe('9')
    expect(el.modelValue).toBe('9')
  })

  it('keeps a lone zero', async () => {
    const el = await mount(moneyProps)
    await type(el, '0')

    expect(display(el)).toBe('0')
    expect(el.modelValue).toBe('0')
  })

  it('keeps the zero of a decimal, typed with either separator', async () => {
    // The whole point of the lookahead: what follows this zero is a point, not a digit.
    const dot = await mount(moneyProps)
    await type(dot, '0.9')
    expect(display(dot)).toBe('0,9')
    expect(dot.modelValue).toBe('0.9')

    const comma = await mount(moneyProps)
    await type(comma, '0,9')
    expect(display(comma)).toBe('0,9')
    expect(comma.modelValue).toBe('0.9')
  })

  it('keeps a trailing point so a decimal can be typed left to right', async () => {
    // `0.` must survive the strip, or the next keystroke never gets a fraction to land in.
    const el = await mount(moneyProps)
    await type(el, '0.')

    expect(display(el)).toBe('0,')
  })

  it('still reads its own grouped output as grouping', async () => {
    // The field re-strips the whole display on every keystroke, so `1.000` has to keep meaning a
    // thousand — this is what the "not exactly 3 digits" rule protects.
    const el = await mount(moneyProps)
    await type(el, '1.000')
    expect(el.modelValue).toBe('1000')

    await type(el, '1.000.000')
    expect(el.modelValue).toBe('1000000')
    expect(display(el)).toBe('1.000.000')
  })

  it('lets an explicit decimal separator win over the dot rule', async () => {
    const el = await mount(moneyProps)
    await type(el, '1.000,5')

    expect(el.modelValue).toBe('1000.5')
  })

  it('leaves separators alone when the pattern has no fraction', async () => {
    // Top Up is whole-rupiah; nothing here may give it a decimal.
    const el = await mount({ ...moneyProps, formatDisplay: '#,##0', formatValue: '#,##0' })
    await type(el, '0.9')

    expect(el.modelValue).toBe('9')
  })

  it('promotes a typed comma under a comma-grouping locale', async () => {
    const el = await mount({ ...moneyProps, formatLocale: US })
    await type(el, '0,9')
    expect(el.modelValue).toBe('0.9')
    expect(display(el)).toBe('0.9')

    await type(el, '1,000')
    expect(el.modelValue).toBe('1000')
  })
})

describe('stripFormat — a group character used as a decimal point', () => {
  const money = parseFormat('#,##0.##')!
  const whole = parseFormat('#,##0')!

  it('promotes a dot with a short digit run', () => {
    expect(stripFormat('0.9', money, ID)).toBe('0.9')
    expect(stripFormat('0.99', money, ID)).toBe('0.99')
  })

  it('promotes a trailing dot, so the point can be typed', () => {
    expect(stripFormat('0.', money, ID)).toBe('0.')
  })

  it('treats a three-digit run as grouping — the formatter only ever writes those', () => {
    expect(stripFormat('1.000', money, ID)).toBe('1000')
    expect(stripFormat('1.000.000', money, ID)).toBe('1000000')
  })

  it('leaves a run longer than the fraction as grouping', () => {
    expect(stripFormat('1.0000', money, ID)).toBe('10000')
  })

  it('defers to the locale decimal character when it is present', () => {
    expect(stripFormat('1.000,5', money, ID)).toBe('1000.5')
  })

  it('cannot reach a three-digit fraction by dot — the documented limitation', () => {
    const three = parseFormat('#,##0.###')!
    // `0.123` reads as grouping; the locale separator is the way in.
    expect(stripFormat('0.123', three, ID)).toBe('0123')
    expect(stripFormat('0,123', three, ID)).toBe('0.123')
  })

  it('promotes nothing when the pattern has no fraction', () => {
    expect(stripFormat('0.9', whole, ID)).toBe('09')
  })

  it('mirrors under a comma-grouping locale', () => {
    expect(stripFormat('0,9', money, US)).toBe('0.9')
    expect(stripFormat('1,000', money, US)).toBe('1000')
    expect(stripFormat('1,000.5', money, US)).toBe('1000.5')
  })
})

describe('applyFormat — leading zeros', () => {
  const money = parseFormat('#,##0.##')!

  it('drops them, matching what normaliseValue does to the value', () => {
    expect(applyFormat('09', money, ID)).toBe('9')
    expect(applyFormat('00009999999', money, ID)).toBe('9.999.999')
    expect(normaliseValue('00009999999', money)).toBe('9999999')
  })

  it('keeps a lone zero and the zero of a fraction', () => {
    expect(applyFormat('0', money, ID)).toBe('0')
    expect(applyFormat('0.9', money, ID)).toBe('0,9')
    expect(applyFormat('0.', money, ID)).toBe('0,')
  })

  it('keeps a negative sign in front of the trimmed digits', () => {
    expect(applyFormat('-09', money, ID)).toBe('-9')
  })
})
