// Split `:is(a, b)` into the selector list `a, b` in the BUILT stylesheet (dist/ui/index.css).
//
// WHY. The sheets write their legacy-class aliases as `:is([mono-x],.mono-x)`
// (scripts/legacy-class-alias.mjs — table.css and dropdown-table.css alone carry ~500).
// A browser buckets each rule by the RIGHTMOST compound of its selector — id, class,
// attribute, tag — and only tests a rule against elements that could match that bucket.
// A multi-argument `:is()` cannot be bucketed, so every such rule lands in the universal
// bucket and is tested against EVERY element on the page. Measured on a 300-row × 3 table
// of `mono-input` (Chromium, the shipped index.css): style recalc during mount 210 → 96ms,
// and a plain `<span>` table 113 → 58ms — the cost was on every page, not just tables.
//
// The authored sheets keep the readable `:is()` form (and legacy-class-alias.mjs keeps
// owning them); only the emitted CSS is rewritten.
//
// WHAT IS SPLIT — deliberately conservative, so the result is identical by construction:
//   - only an `:is(` at the TOP LEVEL of a selector (never inside `:not()` / `:has()` /
//     another `:is()`, where a list would change the meaning);
//   - only when every argument is a SIMPLE compound — an optional tag plus classes and
//     attribute selectors, no pseudo-classes, no escapes. Those are valid everywhere, which
//     matters because `:is()` is FORGIVING (an invalid argument is dropped) while a plain
//     selector list is not (one invalid selector drops the whole rule);
//   - only when every argument has the SAME specificity. `:is()` takes the heaviest
//     argument's weight, so with equal weights each split selector weighs exactly what the
//     `:is()` did and the cascade cannot change. (An attribute and a class both weigh 0,1,0.)
//   - `:where()` is never touched: its weight is zero whatever it holds.
//   - a rule's list is capped at MAX_SELECTORS; past that the remaining `:is()`s stay.
//
// Nested rules are fine: `&` means the whole parent list either way.

import postcss from 'postcss'

/** Past this many selectors a rule keeps its remaining `:is()`s — guards a cartesian blow-up. */
export const MAX_SELECTORS = 64

/** `tag`, `.class`, `[attr…]` — no pseudo, no `#id`, no escapes, no combinators. */
const SIMPLE = /^(?:[a-zA-Z][\w-]*)?(?:\.[a-zA-Z_-][\w-]*|\[[^\]\\]+\])*$/

/** Split at top-level commas, respecting (), [], quotes and backslash escapes. */
export function splitTopLevel(text) {
  const out = []
  let depth = 0
  let quote = ''
  let cur = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\') {
      cur += ch + (text[i + 1] ?? '')
      i++
      continue
    }
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

/** Weight of a SIMPLE compound: [classes + attributes, tags]. */
function weight(compound) {
  const attrs = (compound.match(/\[[^\]]*\]/g) ?? []).length
  const classes = (compound.replace(/\[[^\]]*\]/g, '').match(/\.[a-zA-Z_-]/g) ?? []).length
  const tag = /^[a-zA-Z]/.test(compound) ? 1 : 0
  return `${attrs + classes},${tag}`
}

/**
 * The first splittable top-level `:is(…)` of `selector`, expanded into one selector per
 * argument — or `null` when it has none.
 */
export function expandFirstIs(selector) {
  let depth = 0
  let quote = ''
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]
    if (ch === '\\') {
      i++
      continue
    }
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '[') {
      depth++
      continue
    }
    if (ch === ']') {
      depth--
      continue
    }
    if (ch === ')') {
      depth--
      continue
    }
    if (ch !== '(') continue
    const isHere = depth === 0 && selector.slice(i - 3, i) === ':is' && selector[i - 4] !== ':'
    depth++
    if (!isHere) continue

    // Find the matching `)`.
    let d = 1
    let j = i + 1
    for (; j < selector.length && d > 0; j++) {
      const c = selector[j]
      if (c === '\\') {
        j++
        continue
      }
      if (c === '(') d++
      else if (c === ')') d--
    }
    const close = j - 1
    if (d !== 0) return null
    const args = splitTopLevel(selector.slice(i + 1, close))
    const before = selector.slice(0, i - 3)
    // A type selector must open its compound: `[x]:is(button, a)` cannot become `[x]button`.
    const atCompoundStart = before === '' || /[\s>+~]$/.test(before)
    const splittable =
      args.length > 1 &&
      args.every((a) => a && SIMPLE.test(a) && (atCompoundStart || !/^[a-zA-Z]/.test(a))) &&
      new Set(args.map(weight)).size === 1
    if (splittable) {
      const after = selector.slice(close + 1)
      return args.map((a) => before + a + after)
    }
    // Not splittable: skip past it and keep looking at the rest of this selector.
    depth--
    i = close
  }
  return null
}

/** Expand every splittable `:is()` of a selector list, up to MAX_SELECTORS. */
export function splitIsInSelectorList(selectorText) {
  let list = splitTopLevel(selectorText)
  for (;;) {
    let changed = false
    const next = []
    for (let k = 0; k < list.length; k++) {
      const sel = list[k]
      const expanded = expandFirstIs(sel)
      // Room for the expansion plus everything still to come.
      if (expanded && next.length + expanded.length + (list.length - k - 1) <= MAX_SELECTORS) {
        next.push(...expanded)
        changed = true
      } else next.push(sel)
    }
    list = next
    if (!changed) return list
  }
}

/** Rewrite a whole stylesheet. Returns the new CSS and how many rules changed. */
export function splitIsSelectors(css) {
  const root = postcss.parse(css)
  let rules = 0
  root.walkRules((rule) => {
    if (!rule.selector.includes(':is(')) return
    const list = splitIsInSelectorList(rule.selector)
    const joined = list.join(',')
    if (joined === splitTopLevel(rule.selector).join(',')) return
    rule.selector = joined
    rules++
  })
  return { css: root.toString(), rules }
}
