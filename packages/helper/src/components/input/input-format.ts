/**
 * `<mono-input>` value formatting — the pattern dialect, and the caret maths that make it usable
 * while typing.
 *
 * Everything here is PURE and DOM-free on purpose: live formatting is easy to get subtly wrong
 * (trailing separators, a caret that jumps to the end, a value that stops parsing), and those are
 * only cheap to test when they are plain functions.
 *
 * ── Two dialects, chosen by content ──
 *
 * A pattern containing `{}` is a TEMPLATE — the typed text goes in the hole and everything else is
 * literal (`"{}@gmail.com"`). Anything else is a NUMBER pattern in the Excel / DevExtreme surface
 * syntax the rest of this codebase already speaks (`#,##0.##`):
 *
 *   `#`     an optional digit
 *   `0`     a required digit (pads with zeros)
 *   `,`     turn on grouping
 *   `.`     the decimal point
 *   `"…"`   a literal prefix or suffix (`"Rp"#,##0`)
 *
 * The pattern describes a SHAPE — grouping on, up to two decimals — and the LOCALE decides which
 * characters that shape is drawn with, so `#,##0.##` prints `10,000.25` under `en-US` and
 * `10.000,25` under `id-ID`. Nothing here hand-rolls a separator.
 *
 * ── Why this does not use `parseNumber` from `src/import/coerce.ts` ──
 *
 * That parser exists to read numbers whose locale is UNKNOWN, so it infers the separators from the
 * text — and its rule ("a single `.` with exactly three trailing digits is grouping") is a good
 * guess but still a guess: `1.234` is 1234 while `1.23` is 1.23. Here the locale is declared, so
 * the separators can be derived from `Intl` and the strip is exact rather than inferred. Guessing
 * would be strictly worse when the answer is already known.
 */

/** When the display reformats. */
export type InputFormatOn = 'input' | 'blur'

/** What a format FUNCTION receives. */
export interface InputFormatCtx {
  /** The typed text with any formatting removed — the raw value. */
  value: string
  /** The input's `type`, so one function can serve several fields. */
  type: string
  /** The resolved locale, when one was given. */
  locale?: string
}

/** A pattern string, or a function that returns the finished text. */
export type InputFormat = string | ((ctx: InputFormatCtx) => string)

/** A parsed pattern. */
export type InputFormatDescriptor =
  | {
      kind: 'number'
      grouping: boolean
      minFraction: number
      maxFraction: number
      prefix: string
      suffix: string
    }
  | { kind: 'template'; before: string; after: string }

/** The characters a locale draws a grouped decimal number with. */
export interface LocaleSeparators {
  group: string
  decimal: string
}

const SEPARATOR_CACHE = new Map<string, LocaleSeparators>()

/**
 * Ask `Intl` which characters this locale uses, rather than assuming `,` and `.`.
 *
 * Several locales use neither — `fr-FR` groups with a narrow no-break space, `de-CH` with an
 * apostrophe — and a hardcoded pair would silently mangle them.
 */
export function localeSeparators(locale?: string): LocaleSeparators {
  const key = locale ?? ''
  const cached = SEPARATOR_CACHE.get(key)
  if (cached) return cached

  let separators: LocaleSeparators = { group: ',', decimal: '.' }
  try {
    const parts = new Intl.NumberFormat(locale || undefined, {
      useGrouping: true,
      minimumFractionDigits: 1,
    }).formatToParts(12345.6)
    separators = {
      group: parts.find((p) => p.type === 'group')?.value ?? ',',
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    }
  } catch {
    /* keep the fallback */
  }

  SEPARATOR_CACHE.set(key, separators)
  return separators
}

/**
 * Parse a pattern string into a descriptor, or `null` when it is not a pattern we understand.
 *
 * `null` is deliberately not an error: an unparseable pattern leaves the field an ordinary
 * unformatted input rather than blanking it or throwing mid-keystroke.
 */
export function parseFormat(pattern: string): InputFormatDescriptor | null {
  const raw = String(pattern ?? '')
  if (!raw) return null

  // Template: the hole splits it. Only the FIRST `{}` counts — a second one has no sensible
  // meaning for a single value, and treating it as a literal is the honest reading.
  const hole = raw.indexOf('{}')
  if (hole !== -1) {
    return { kind: 'template', before: raw.slice(0, hole), after: raw.slice(hole + 2) }
  }

  // Number: pull the quoted literals off each end first, so `"Rp"#,##0` leaves `#,##0` as the body.
  let body = raw
  let prefix = ''
  let suffix = ''

  const leading = body.match(/^"([^"]*)"/)
  if (leading) {
    prefix = leading[1] ?? ''
    body = body.slice(leading[0].length)
  }

  const trailing = body.match(/"([^"]*)"$/)
  if (trailing) {
    suffix = trailing[1] ?? ''
    body = body.slice(0, body.length - trailing[0].length)
  }

  // What is left must be digit placeholders, grouping commas and at most one decimal point.
  if (!body || !/^[#0,]*(?:\.[#0]*)?$/.test(body)) return null
  if (!/[#0]/.test(body)) return null

  const [intPart = '', fracPart] = body.split('.')

  return {
    kind: 'number',
    grouping: intPart.includes(','),
    // `0`s are required digits, so they set the FLOOR; `#`s are optional and only raise the ceiling.
    minFraction: fracPart ? (fracPart.match(/0/g) ?? []).length : 0,
    maxFraction: fracPart ? fracPart.length : 0,
    prefix,
    suffix,
  }
}

/**
 * Strip a formatted string back to its raw value.
 *
 * For numbers the result is always canonical — digits, an optional leading `-`, and `.` as the
 * decimal point — whatever the locale draws with, so it is safe to hand to `Number()`.
 */
/**
 * Decide whether a GROUP character in the text is really the decimal point the user typed.
 *
 * It exists because the two roles collide: in `id-ID` the grouping character is `.`, so typing
 * `0.9` produced `09` — the strip deleted the point before anything could read it as one. Yet
 * `1.000` typed in the same field must keep meaning a thousand, and that is not a matter of
 * guessing intent: the field re-strips its OWN formatted text on every keystroke, and
 * `addGrouping` only ever emits runs of exactly three digits.
 *
 * So a group character is the decimal point when
 *   · the pattern has a fraction at all,
 *   · the locale's real decimal character is nowhere in the text (an explicit `1.000,5` wins), and
 *   · the digits after the LAST group character number at most `maxFraction` and are not exactly 3.
 *
 * A run of length ZERO qualifies deliberately: a trailing `0.` must survive, or the point is
 * deleted the instant it is typed and `0.9` can never be reached left to right — `applyFormat`
 * carries the matching rule that keeps a lone trailing point on screen.
 *
 * The consequence, and it is documented rather than worked around: under a dot-grouping locale a
 * THREE-digit fraction (`0.123`) is unreachable by dot and has to be typed `0,123`.
 *
 * Returns the split, or `null` when every group character is grouping. Works for either locale
 * shape — under `en-US` the roles are simply swapped and a typed `,` is promoted the same way.
 */
function decimalGroupSplit(
  text: string,
  descriptor: Extract<InputFormatDescriptor, { kind: 'number' }>,
  group: string,
  decimal: string,
): { head: string; tail: string } | null {
  if (descriptor.maxFraction <= 0) return null
  if (!group || group === decimal) return null
  if (text.includes(decimal)) return null

  const at = text.lastIndexOf(group)
  if (at === -1) return null

  const tail = text.slice(at + group.length)
  if (tail.length > descriptor.maxFraction || tail.length === 3) return null
  if (tail && !/^\d+$/.test(tail)) return null

  return { head: text.slice(0, at), tail }
}

export function stripFormat(
  text: string,
  descriptor: InputFormatDescriptor | null,
  locale?: string,
): string {
  const value = String(text ?? '')
  if (!descriptor) return value

  if (descriptor.kind === 'template') {
    let out = value
    if (descriptor.before && out.startsWith(descriptor.before)) out = out.slice(descriptor.before.length)
    if (descriptor.after && out.endsWith(descriptor.after)) out = out.slice(0, out.length - descriptor.after.length)
    return out
  }

  const { group, decimal } = localeSeparators(locale)

  let out = value
  if (descriptor.prefix) out = out.split(descriptor.prefix).join('')
  if (descriptor.suffix) out = out.split(descriptor.suffix).join('')

  // A group character the user meant as a DECIMAL POINT — see `decimalGroupSplit`. The two paths
  // have to be exclusive: promoting first and then falling through to the general strip below
  // would delete the very point just inserted, because under `id-ID` that point IS the group
  // character. So the head is stripped on its own and the point is re-attached after.
  const promoted = decimalGroupSplit(out, descriptor, group, decimal)

  if (promoted) {
    // `decimalGroupSplit` only fires when the locale's decimal character is absent, so there is
    // nothing left to map here.
    out = `${promoted.head.split(group).join('')}.${promoted.tail}`
  } else {
    // Grouping characters go first, then the locale's decimal point becomes a plain `.`. Order
    // matters: a locale whose group separator is `.` would otherwise lose its decimal point too.
    out = out.split(group).join('')
    if (decimal !== '.') out = out.split(decimal).join('.')
  }

  const negative = out.trimStart().startsWith('-')
  out = out.replace(/[^\d.]/g, '')

  // Keep only the FIRST decimal point — a stray second one is a typo, not a second fraction.
  const first = out.indexOf('.')
  if (first !== -1) {
    out = out.slice(0, first + 1) + out.slice(first + 1).replace(/\./g, '')
  }

  if (descriptor.maxFraction === 0) out = out.split('.')[0] ?? ''

  return negative && out ? `-${out}` : out
}

/**
 * Render a raw value for DISPLAY.
 *
 * The number branch deliberately does NOT hand the whole string to `Intl`: a value being typed is
 * usually not yet a finished number, and `Intl` would tidy away exactly the characters the user is
 * in the middle of writing — a trailing decimal point (`10000.`) and trailing fraction zeros
 * (`10.50`) both vanish, which makes the field fight the person using it. Only the INTEGER part is
 * grouped; the fraction is carried through verbatim, clamped to the pattern's ceiling.
 */
export function applyFormat(
  raw: string,
  descriptor: InputFormatDescriptor | null,
  locale?: string,
  opts: { pad?: boolean } = {},
): string {
  const value = String(raw ?? '')
  if (!descriptor) return value

  if (descriptor.kind === 'template') {
    if (!value) return ''
    return `${descriptor.before}${value}${descriptor.after}`
  }

  if (!value || value === '-') return value

  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [intRaw = '', fracRaw] = unsigned.split('.')
  const hasPoint = unsigned.includes('.')

  const { group, decimal } = localeSeparators(locale)

  // Leading zeros go, exactly as `normaliseValue` already drops them from the VALUE. Without this
  // the two disagreed: a field sitting at `0` showed `0999999` while the model said `999999`.
  // The lookahead is what makes it safe — it only removes a zero followed by a DIGIT, so a lone
  // `0` survives, and so does the `0` of `0.9`, where what follows it is the decimal point.
  const digits = intRaw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  // `Number` would lose precision on a long digit string, so group by hand — the separator itself
  // still comes from the locale.
  const grouped = descriptor.grouping ? addGrouping(digits, group) : digits

  let fraction = (fracRaw ?? '').replace(/\D/g, '').slice(0, descriptor.maxFraction)

  // `pad` is for a COMMITTED value (blur, or a value arriving from outside): only then is it right
  // to add the zeros a `0` placeholder asks for. Doing it while typing would type them for you.
  if (opts.pad && descriptor.minFraction > 0) {
    fraction = fraction.padEnd(descriptor.minFraction, '0')
  }

  let out = grouped || (hasPoint ? '0' : '')
  if (fraction) out += decimal + fraction
  // A decimal point the user has typed but not yet filled must survive, or it is impossible to type.
  else if (hasPoint && descriptor.maxFraction > 0 && !opts.pad) out += decimal

  if (!out) return ''
  return `${descriptor.prefix}${negative ? '-' : ''}${out}${descriptor.suffix}`
}

/** Group a digit string from the right. */
function addGrouping(digits: string, separator: string): string {
  if (digits.length < 4) return digits
  let out = ''
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += separator
    out += digits[i]
  }
  return out
}

/**
 * Normalise a raw value for the VALUE side.
 *
 * A number pattern yields a canonical numeric string (`"10000000.25"`) rather than the formatted
 * text, so `Number(v)` works and a store that does arithmetic on it does not have to know a format
 * was ever involved. A template yields the assembled string, because there the decoration IS the
 * value — an email is not an email without its domain.
 */
export function normaliseValue(
  raw: string,
  descriptor: InputFormatDescriptor | null,
): string {
  const value = String(raw ?? '')
  if (!descriptor) return value
  if (descriptor.kind === 'template') return value ? `${descriptor.before}${value}${descriptor.after}` : ''

  if (!value || value === '-') return ''

  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [intRaw = '', fracRaw] = unsigned.split('.')

  const digits = intRaw.replace(/\D/g, '')
  const fraction = (fracRaw ?? '').replace(/\D/g, '').slice(0, descriptor.maxFraction)

  let out = digits.replace(/^0+(?=\d)/, '')
  if (!out) out = digits ? '0' : ''
  if (!out && !fraction) return ''
  if (fraction) out = `${out || '0'}.${fraction}`

  return negative && out ? `-${out}` : out
}

/**
 * Where the caret belongs after the text was reformatted.
 *
 * Reformatting rewrites the whole field, and the browser then parks the caret at the end — so
 * inserting a digit in the middle of a number would throw you to the end on every keystroke. The
 * fix is to count in SIGNIFICANT characters (the ones the user actually typed) rather than in
 * string offsets: count how many sit left of the caret before, then walk the new text until the
 * same number have gone by.
 */
export function caretAfterFormat(
  next: string,
  caretInPrev: number,
  prev: string,
  isSignificant: (ch: string) => boolean,
): number {
  let typed = 0
  for (let i = 0; i < Math.min(caretInPrev, prev.length); i++) {
    if (isSignificant(prev[i] as string)) typed++
  }

  if (typed === 0) {
    // Nothing significant to the left: sit before the first significant character, so a leading
    // prefix like "Rp" cannot swallow the caret.
    let i = 0
    while (i < next.length && !isSignificant(next[i] as string)) i++
    return i
  }

  let seen = 0
  for (let i = 0; i < next.length; i++) {
    if (isSignificant(next[i] as string)) {
      seen++
      if (seen === typed) return i + 1
    }
  }
  return next.length
}

/**
 * Which characters count as "typed" for caret purposes — everything the format did NOT insert.
 */
export function significantFor(
  descriptor: InputFormatDescriptor | null,
  locale?: string,
): (ch: string) => boolean {
  if (!descriptor || descriptor.kind === 'template') return () => true
  const { decimal } = localeSeparators(locale)
  return (ch: string) => /\d/.test(ch) || ch === decimal || ch === '-'
}

/** Resolve either form of a format prop to its finished text. */
export function resolveFormat(
  format: InputFormat | undefined,
  raw: string,
  ctx: { type: string; locale?: string },
  mode: 'display' | 'value',
): string | null {
  if (format == null || format === '') return null

  if (typeof format === 'function') {
    return String(format({ value: raw, type: ctx.type, locale: ctx.locale }) ?? '')
  }

  const descriptor = parseFormat(format)
  if (!descriptor) return null

  return mode === 'display'
    ? applyFormat(raw, descriptor, ctx.locale)
    : normaliseValue(raw, descriptor)
}
