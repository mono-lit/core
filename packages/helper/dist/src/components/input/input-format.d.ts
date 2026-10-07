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
export type InputFormatOn = 'input' | 'blur';
/** What a format FUNCTION receives. */
export interface InputFormatCtx {
    /** The typed text with any formatting removed — the raw value. */
    value: string;
    /** The input's `type`, so one function can serve several fields. */
    type: string;
    /** The resolved locale, when one was given. */
    locale?: string;
}
/** A pattern string, or a function that returns the finished text. */
export type InputFormat = string | ((ctx: InputFormatCtx) => string);
/** A parsed pattern. */
export type InputFormatDescriptor = {
    kind: 'number';
    grouping: boolean;
    minFraction: number;
    maxFraction: number;
    prefix: string;
    suffix: string;
} | {
    kind: 'template';
    before: string;
    after: string;
};
/** The characters a locale draws a grouped decimal number with. */
export interface LocaleSeparators {
    group: string;
    decimal: string;
}
/**
 * Ask `Intl` which characters this locale uses, rather than assuming `,` and `.`.
 *
 * Several locales use neither — `fr-FR` groups with a narrow no-break space, `de-CH` with an
 * apostrophe — and a hardcoded pair would silently mangle them.
 */
export declare function localeSeparators(locale?: string): LocaleSeparators;
/**
 * Parse a pattern string into a descriptor, or `null` when it is not a pattern we understand.
 *
 * `null` is deliberately not an error: an unparseable pattern leaves the field an ordinary
 * unformatted input rather than blanking it or throwing mid-keystroke.
 */
export declare function parseFormat(pattern: string): InputFormatDescriptor | null;
export declare function stripFormat(text: string, descriptor: InputFormatDescriptor | null, locale?: string): string;
/**
 * Render a raw value for DISPLAY.
 *
 * The number branch deliberately does NOT hand the whole string to `Intl`: a value being typed is
 * usually not yet a finished number, and `Intl` would tidy away exactly the characters the user is
 * in the middle of writing — a trailing decimal point (`10000.`) and trailing fraction zeros
 * (`10.50`) both vanish, which makes the field fight the person using it. Only the INTEGER part is
 * grouped; the fraction is carried through verbatim, clamped to the pattern's ceiling.
 */
export declare function applyFormat(raw: string, descriptor: InputFormatDescriptor | null, locale?: string, opts?: {
    pad?: boolean;
}): string;
/**
 * Normalise a raw value for the VALUE side.
 *
 * A number pattern yields a canonical numeric string (`"10000000.25"`) rather than the formatted
 * text, so `Number(v)` works and a store that does arithmetic on it does not have to know a format
 * was ever involved. A template yields the assembled string, because there the decoration IS the
 * value — an email is not an email without its domain.
 */
export declare function normaliseValue(raw: string, descriptor: InputFormatDescriptor | null): string;
/**
 * Where the caret belongs after the text was reformatted.
 *
 * Reformatting rewrites the whole field, and the browser then parks the caret at the end — so
 * inserting a digit in the middle of a number would throw you to the end on every keystroke. The
 * fix is to count in SIGNIFICANT characters (the ones the user actually typed) rather than in
 * string offsets: count how many sit left of the caret before, then walk the new text until the
 * same number have gone by.
 */
export declare function caretAfterFormat(next: string, caretInPrev: number, prev: string, isSignificant: (ch: string) => boolean): number;
/**
 * Which characters count as "typed" for caret purposes — everything the format did NOT insert.
 */
export declare function significantFor(descriptor: InputFormatDescriptor | null, locale?: string): (ch: string) => boolean;
/** Resolve either form of a format prop to its finished text. */
export declare function resolveFormat(format: InputFormat | undefined, raw: string, ctx: {
    type: string;
    locale?: string;
}, mode: 'display' | 'value'): string | null;
