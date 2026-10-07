// shadow-css.ts
//
// Derive a component's shadow-DOM stylesheet from its single light-DOM CSS, so
// each component keeps ONE source `X.css` instead of a near-duplicate
// `X.shadow.css`. Used by the `@mono-lit/helper/ui/shadow/*` builds:
//
//   import css from './nav.css?raw'
//   static styles = [unsafeCSS(toShadowCss(css, { host: 'mono-nav' }))]
//
// The transform is intentionally minimal — it only does what actually differs
// between the light and shadow sheets:
//   - rewrite a bare element selector (`mono-nav`, `mono-nav[sticky]`) to
//     `:host` / `:host([sticky])` (for components whose host carries top-level
//     styling). `.mono-nav`, `mono-nav-inner`, etc. are left untouched.
//   - optionally prepend `:host { display: … }` (for components like dropdown
//     whose state classes live on an INNER root, so there is no element
//     selector to rewrite — only the host needs a display value).
//   - optionally append shadow-only rules (e.g. `[data-empty]{display:none}`).
//   - append the shared scrollbar sheet (see the import below).
//
// Rules that are inert inside a shadow root (e.g. nav's `.mono-layout-content`,
// input's standalone-`<div>` block, dropdown's CSS-only static placement) are
// deliberately LEFT IN — they never match in the shadow tree, so there is no
// need for fragile section-stripping.

import {
  isServer,
  type LitElement,
  type ReactiveController,
  type ReactiveControllerHost,
} from 'lit'

// The shared scrollbar design. `dist/ui/index.css` never loads into a shadow
// root — a shadow sheet is only the component's own CSS — so every shadow build
// gets this appended instead, which keeps ONE source for both lanes. Inert in
// the roots that hold no scroll container, and its selectors are all classes, so
// the `host` element-selector rewrite below cannot touch them. `?raw` inlines at
// build time, so this costs nothing at runtime and nothing on the server.
import scrollbarCss from '../data/theme/scrollbar.css?raw'
// The same for the selection wash, and for the same reason.
import selectionCss from '../data/theme/selection.css?raw'
// The automatic skeleton (`pending`): the theme hooks of the `<phantom-ui>` wrapper, plus
// the shadow-only copy of the content-hiding rules phantom injects into document.head
// (which never reaches a shadow root). Same two-lane wiring again.
import skeletonCss from '../components/skeleton/skeleton.css?raw'
import skeletonShadowCss from '../components/skeleton/skeleton-shadow.css?raw'

type Constructor<T = object> = new (...args: any[]) => T

export interface ToShadowCssOptions {
  /**
   * Element-selector tag to rewrite to `:host` (e.g. `'mono-nav'`). Handles
   * `tag { … }`, `tag[attr] { … }` and `tag,` — but NOT `.tag` or `tag-suffix`.
   */
  host?: string
  /**
   * Prepend `:host { display: <value> }`. Use when the component has no element
   * selector to rewrite (its state classes live on an inner root) but the host
   * still needs a display value (e.g. dropdown → `'inline-block'`).
   */
  hostDisplay?: string
  /** Shadow-only CSS appended verbatim (e.g. `[data-empty] { display: none }`). */
  append?: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function toShadowCss(css: string, opts: ToShadowCssOptions = {}): string {
  let out = css

  if (opts.host) {
    const tag = escapeRegExp(opts.host)

    // `tag[attr]` → `:host([attr])` (run before the bare-tag rewrite).
    out = out.replace(
      new RegExp(`(^|[\\s,{}])${tag}\\[([^\\]]*)\\]`, 'g'),
      (_m, pre: string, attr: string) => `${pre}:host([${attr}])`,
    )

    // bare `tag` used as an element selector → `:host`
    // (not `.tag`, not `tag-suffix`, not `tag[...]`).
    out = out.replace(
      new RegExp(`(^|[\\s,{}])${tag}\\b(?![-[])`, 'g'),
      (_m, pre: string) => `${pre}:host`,
    )
  }

  const prepend = opts.hostDisplay
    ? `:host { display: ${opts.hostDisplay}; }\n`
    : ''

  const append = opts.append ? `\n${opts.append}` : ''

  // Scrollbar rules go LAST so a component's own sheet — and a caller's
  // `append` — could still win on an equal-specificity tie.
  return `${prepend}${out}${append}\n${scrollbarCss}\n${selectionCss}\n${skeletonCss}\n${skeletonShadowCss}`
}

// ───────────────────────────────────────────────────────────────────────────
// Icon-CSS adoption
//
// Global utility CSS (UnoCSS preset-icons `.i-mdi-*` / the `.mono-icon` helper)
// does NOT cross a shadow-root boundary, so data-driven icons rendered as
// `<span class="i-mdi-…">` inside a shadow component show up blank. Rather than
// bundle an icon set, we copy the page's already-generated icon rules into ONE
// shared constructable stylesheet (built lazily, once) and adopt it into each
// shadow root. This keeps the icon markup identical between the light and shadow
// builds (no hydration mismatch) while making the glyphs paint inside the shadow
// tree, for ANY icon set the host uses. Server-side this is a no-op (icons paint
// at hydration); the shared sheet means N components share one stylesheet object.
// ───────────────────────────────────────────────────────────────────────────

// ONE live, shared stylesheet object reused across every menu shadow root.
// Constructable stylesheets are live: once a root has adopted this object,
// mutating it (adding rules later, when the page's UnoCSS finally loads) updates
// the rendering in every adopter — so adoption can happen early (empty) and the
// glyphs still appear once `_populated` succeeds.
let _iconSheet: CSSStyleSheet | null = null
/** True once we've captured at least one real `.i-…` ICON rule (not just helpers). */
let _iconSheetReady = false
/** How many icon rules the last collection saw, so a later one can be detected. */
let _iconRuleCount = -1

/** Selectors that target an icon utility class (`.i-…`) or the `.mono-icon` helper. */
const ICON_SELECTOR = /(^|[\s,>+~(])\.(i-[a-z0-9]|mono-icon)/i
/** A real data-driven icon utility (`.i-mdi-…`) — what we actually wait for. */
const ICON_GLYPH_SELECTOR = /(^|[\s,>+~(])\.i-[a-z0-9]/i

/**
 * The mask a collected icon rule loses on the way in.
 *
 * UnoCSS emits `--un-icon: url(…)` together with `mask-image: var(--un-icon)`,
 * but Chrome serialises that mask back out of `cssText` as an EMPTY value — so
 * copying the rule text, which is the only way to move a rule into a
 * constructable sheet, drops the one declaration that paints the glyph. The
 * result is an element with the right size, the right `currentColor` fill and
 * nothing to show for it.
 *
 * Restating it here costs one rule. An element without `--un-icon` resolves the
 * var to nothing, which makes `mask-image` invalid at computed-value time and
 * therefore `none` — so this cannot mask anything that is not an icon.
 */
const ICON_MASK_RULE = `
[class^='i-'],
[class*=' i-'] {
  mask-image: var(--un-icon);
  -webkit-mask-image: var(--un-icon);
  mask-size: 100% 100%;
  -webkit-mask-size: 100% 100%;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}`

/**
 * How many icon rules the document currently carries. Counting is far cheaper
 * than collecting, and it is the only way to notice that UnoCSS has generated a
 * class since the last collection.
 */
function countIconRules(): number {
  if (typeof document === 'undefined') return -1
  let n = 0
  for (const styleSheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = styleSheet.cssRules
    } catch {
      continue
    }
    for (const rule of Array.from(rules)) {
      const selector = (rule as CSSStyleRule).selectorText
      if (selector && ICON_SELECTOR.test(selector)) n++
    }
  }
  return n
}

function ensureIconSheet(): CSSStyleSheet | null {
  if (isServer || typeof document === 'undefined' || typeof CSSStyleSheet === 'undefined') {
    return null
  }

  if (!_iconSheet) {
    try {
      _iconSheet = new CSSStyleSheet()
    } catch {
      return null
    }
  }

  // Keep (re)populating the SAME object until we've captured icon glyph rules —
  // the UnoCSS `<link>` (`/_nuxt/__uno.css`) may not be loaded/readable yet on
  // the first call, and `menu.css` itself contributes a `.mono-icon` rule that
  // must not let us cache prematurely.
  //
  // Once ready we still re-collect if the page has GROWN icon rules since the
  // last pass: UnoCSS generates them on demand, so a class whose first use comes
  // after the snapshot would otherwise never reach a shadow root — the glyph box
  // is there and empty while the light build paints it.
  if (_iconSheetReady && countIconRules() === _iconRuleCount) return _iconSheet

  const collected: string[] = []
  const seen = new Set<string>()
  let glyphFound = false

  for (const styleSheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = styleSheet.cssRules
    } catch {
      continue // cross-origin / not-yet-loaded sheet — not readable
    }
    for (const rule of Array.from(rules)) {
      const selector = (rule as CSSStyleRule).selectorText
      if (!selector || !ICON_SELECTOR.test(selector)) continue
      if (ICON_GLYPH_SELECTOR.test(selector)) glyphFound = true
      const text = rule.cssText
      if (seen.has(text)) continue
      seen.add(text)
      collected.push(text)
    }
  }

  // Replace the sheet's contents wholesale (sync API; replaceSync is widely
  // supported for constructable sheets).
  try {
    _iconSheet.replaceSync(collected.join('\n') + ICON_MASK_RULE)
  } catch {
    // Fallback: best-effort incremental insert.
    for (const text of [...collected, ICON_MASK_RULE]) {
      try {
        _iconSheet.insertRule(text, _iconSheet.cssRules.length)
      } catch {
        /* skip */
      }
    }
  }

  // Only stop refreshing once the real icon glyph rules are present.
  if (glyphFound) _iconSheetReady = true
  _iconRuleCount = collected.length

  return _iconSheet
}

let _refreshScheduled = false

/**
 * The page's UnoCSS (`/_nuxt/__uno.css`) is a `<link>` that may finish loading
 * AFTER the menu's last render — so `updated()` won't fire again to recapture
 * the icon rules. Poll briefly (~1s of animation frames) to repopulate the live
 * shared sheet; because adopters hold a reference to that same object, the
 * glyphs appear as soon as the rules land — no component re-render required.
 */
function scheduleIconRefresh(): void {
  if (_refreshScheduled || _iconSheetReady || isServer) return
  const raf =
    typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : typeof setTimeout !== 'undefined'
        ? (cb: () => void) => setTimeout(cb, 16)
        : null
  if (!raf) return

  _refreshScheduled = true
  let attempts = 0
  const tick = (): void => {
    attempts++
    ensureIconSheet()
    if (_iconSheetReady || attempts > 60) {
      _refreshScheduled = false
      return
    }
    raf(tick)
  }
  raf(tick)
}

/**
 * Adopt the page's icon utility CSS into `root` so `i-…` / `.mono-icon` glyphs
 * render inside the shadow tree. Idempotent and SSR-safe (no-op on the server).
 * Call from `firstUpdated` AND `updated` — early calls adopt the (live) shared
 * sheet; later calls / the scheduled refresh repopulate it once UnoCSS loads.
 */
export function adoptIconStyles(root: ShadowRoot | null | undefined): void {
  if (isServer || !root || !('adoptedStyleSheets' in root)) return
  const sheet = ensureIconSheet()
  if (!sheet) return
  if (!root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
  }
  if (!_iconSheetReady) scheduleIconRefresh()
}

// ───────────────────────────────────────────────────────────────────────────
// Utility-CSS adoption
//
// Same idea as the icon sheet, but for GENERAL utility classes — UnoCSS
// `.px-6`, `.bg-emerald-50`, `hover:` variants, arbitrary `.shadow-[…]`, etc.
// Global utility rules don't cross a shadow boundary, so a shadow component that
// renders consumer-supplied `cssClass` utilities on its inner regions shows them
// UNSTYLED. We copy the page's class-based rules into ONE shared constructable
// stylesheet and adopt it into each shadow root, so those utilities paint inside
// the shadow tree. Client-only: on the server the shadow root is Declarative
// Shadow DOM (adopted sheets aren't serialized), so SSR renders the utilities
// unstyled and they snap in on hydration.
//
// Kept deliberately scoped so adoption is safe:
//  - only rules whose selector STARTS with a class (`.foo`, `.foo:hover`,
//    `.foo > *`) — so bare tag / `*` / `:root` / `html` / `body` reset rules that
//    would restyle shadow internals are left out;
//  - icon selectors (`.i-…` / `.mono-icon`) are excluded — icons stay with their
//    own strategy, keeping the icon-mask "black-cube" issue out of this path;
//  - `.vp-…` (VitePress theme) is excluded — no doc chrome dragged into the tree.
// ───────────────────────────────────────────────────────────────────────────

// ONE live, shared sheet reused across every shadow root (see the icon note).
let _utilitySheet: CSSStyleSheet | null = null
/** True once the shared sheet has settled — after this we never re-scan on adopt. */
let _utilitySheetReady = false

/** A rule we adopt: leading class selector, not an icon/theme rule. */
function isAdoptableUtilityRule(selector: string): boolean {
  if (!/^\s*\./.test(selector)) return false // must start with a class
  if (/^\s*\.vp-/.test(selector)) return false // VitePress theme
  return !ICON_SELECTOR.test(selector) // icons excluded
}

/** Collect adoptable style rules, descending into `@media`/`@supports` groups. */
function collectUtilityRules(
  rules: CSSRuleList,
  collected: string[],
  seen: Set<string>,
): void {
  for (const rule of Array.from(rules)) {
    const selector = (rule as CSSStyleRule).selectorText
    if (selector) {
      if (!isAdoptableUtilityRule(selector)) continue
      const text = rule.cssText
      if (seen.has(text)) continue
      seen.add(text)
      collected.push(text)
      continue
    }

    // The token layer (`@layer mono-tokens`, src/data/theme/generated/*) wraps
    // class-leading rules too (`.theme-color-*`, `body.dark`), which would drag the
    // whole layer in here. Tokens reach a shadow tree by INHERITANCE from the host;
    // a copy inside the root would re-declare the `var()`-bearing aliases on inner
    // elements and shadow the values the page actually set.
    if ((rule as CSSLayerBlockRule).name === 'mono-tokens') continue

    // `@media (…) { .sm\:foo {…} }` etc. — keep the whole group verbatim when it
    // wraps at least one adoptable class rule (skips `@keyframes`/`@font-face`).
    const group = rule as CSSGroupingRule
    if (group.cssRules?.length) {
      const wrapsUtility = Array.from(group.cssRules).some((inner) => {
        const innerSel = (inner as CSSStyleRule).selectorText
        return Boolean(innerSel && isAdoptableUtilityRule(innerSel))
      })
      if (wrapsUtility) {
        const text = rule.cssText
        if (seen.has(text)) continue
        seen.add(text)
        collected.push(text)
      }
    }
  }
}

/** (Re)scan the page's stylesheets into the shared sheet. Called only while the
 *  sheet is not yet "ready" (initial mount + the one-time settle poll). */
/**
 * The slice of a utility framework's preflight that its own classes DEPEND ON.
 *
 * Tailwind / UnoCSS emit `border` as `border-width: 1px` alone, because their
 * preflight has already set `border-style: solid` on every element. A shadow root
 * gets no preflight, so that class painted nothing: a `cssClass` of
 * `"border border-emerald-200"` gave the light build a 1px line and the shadow
 * build none — the two drifted by 2px and the colour was the giveaway (it applied,
 * the width did not).
 *
 * Kept to what is strictly needed to make the collected utilities behave; it is
 * NOT a full reset, which would fight the component's own styles.
 */
const UTILITY_PREFLIGHT = `
*, ::before, ::after { border-style: solid; border-width: 0; border-color: currentColor; }
`

function buildUtilitySheet(): void {
  if (!_utilitySheet) return
  const collected: string[] = [UTILITY_PREFLIGHT]
  const seen = new Set<string>()
  for (const styleSheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = styleSheet.cssRules
    } catch {
      continue // cross-origin / not-yet-loaded sheet — not readable
    }
    collectUtilityRules(rules, collected, seen)
  }

  try {
    _utilitySheet.replaceSync(collected.join('\n'))
  } catch {
    for (const text of collected) {
      try {
        _utilitySheet.insertRule(text, _utilitySheet.cssRules.length)
      } catch {
        /* skip */
      }
    }
  }
}

function ensureUtilitySheet(): CSSStyleSheet | null {
  if (isServer || typeof document === 'undefined' || typeof CSSStyleSheet === 'undefined') {
    return null
  }

  if (!_utilitySheet) {
    try {
      _utilitySheet = new CSSStyleSheet()
    } catch {
      return null
    }
  }

  // Once settled, return the cached sheet WITHOUT re-scanning — so the per-render
  // `adopt` (runs on every reactive update) stays O(1) and can't jank animations.
  // While not ready, (re)build it: UnoCSS is generated on demand and its `<style>`
  // can grow/land after first paint (the one-time refresh poll drives this).
  if (_utilitySheetReady) return _utilitySheet
  buildUtilitySheet()
  return _utilitySheet
}

let _utilityRefreshScheduled = false

/**
 * The page's UnoCSS may finish loading / grow AFTER a shadow component's last
 * render. Poll briefly (~1s of animation frames), repopulating the live shared
 * sheet each frame; adopters hold a reference to that same object, so utilities
 * appear as soon as their rules land — no component re-render required.
 */
function scheduleUtilityRefresh(): void {
  if (_utilityRefreshScheduled || _utilitySheetReady || isServer) return
  const raf =
    typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : typeof setTimeout !== 'undefined'
        ? (cb: () => void) => setTimeout(cb, 16)
        : null
  if (!raf) return

  // Run ONCE. Repopulate the shared sheet each frame until the rule count settles
  // (UnoCSS done generating) or we hit the cap, then mark ready and STOP — the
  // guard is never reset, so this can't restart on later renders/interactions.
  _utilityRefreshScheduled = true
  let attempts = 0
  let lastCount = -1
  let stable = 0
  const tick = (): void => {
    attempts++
    buildUtilitySheet()
    const count = _utilitySheet?.cssRules.length ?? 0
    if (count === lastCount) stable++
    else {
      stable = 0
      lastCount = count
    }
    if (stable >= 3 || attempts > 60) {
      _utilitySheetReady = true
      return
    }
    raf(tick)
  }
  raf(tick)
}

/**
 * Adopt the page's utility CSS into `root` so consumer `cssClass` utilities
 * (UnoCSS etc.) render inside the shadow tree. Idempotent and SSR-safe (no-op on
 * the server). Call from `firstUpdated` AND `updated` — early calls adopt the
 * (live) shared sheet; the scheduled refresh repopulates it as UnoCSS loads.
 */
export function adoptUtilityStyles(root: ShadowRoot | null | undefined): void {
  if (isServer || !root || !('adoptedStyleSheets' in root)) return
  const sheet = ensureUtilitySheet()
  if (!sheet) return
  if (!root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
  }
  // Only run the settle poll until the sheet is ready; after that this is a no-op,
  // so per-render adopts stay O(1) (no re-scan, no restarted RAF loop).
  if (!_utilitySheetReady) scheduleUtilityRefresh()
}

/** Reactive controller that re-adopts the utility sheet after every render. */
class UtilityStylesController implements ReactiveController {
  constructor(private readonly host: ReactiveControllerHost & LitElement) {
    host.addController(this)
  }
  hostUpdated(): void {
    adoptUtilityStyles(this.host.renderRoot as ShadowRoot)
  }
}

/**
 * Mixin for `*.shadow.ts` builds: adopts the page's utility CSS into the shadow
 * root so consumer `cssClass` utilities (UnoCSS etc.) paint inside the tree.
 * Uses a reactive controller (its `hostUpdated` runs after EVERY render), so it
 * works regardless of whether a subclass overrides `updated`/`firstUpdated`.
 * Client-only — skipped entirely on the server (SSR renders unstyled, utilities
 * snap in on hydration). Apply as `extends withShadowUtilityStyles(XCore(LitElement))`.
 */
export function withShadowUtilityStyles<T extends Constructor<LitElement>>(superClass: T): T {
  class WithShadowUtilityStyles extends superClass {
    constructor(...args: any[]) {
      super(...args)
      if (!isServer) {
        new UtilityStylesController(this as unknown as ReactiveControllerHost & LitElement)
      }
    }
  }
  return WithShadowUtilityStyles as T
}
