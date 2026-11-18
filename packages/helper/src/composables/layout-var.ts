/**
 * Refcounted document-level layout variables.
 *
 * Several components publish their own size as a custom property so page content can
 * offset itself — `--mono-nav-height`, and the sidebar's push width. The property is
 * global but the writers are not: two navs, or two sidebars on the same side, all write
 * the SAME property.
 *
 * Removing it outright on the first unmount blanked the offset for every writer that
 * was still mounted — the page content jumped back underneath a nav or sidebar that
 * is still on screen. That bug was found independently in BOTH `mono-sidebar` and
 * `mono-nav`, which is why the fix lives here rather than being written twice.
 *
 * Ownership is therefore refcounted: the property is removed only when the LAST
 * owner releases it, and until then it is handed back to a remaining owner's last
 * known value. Note that a refcount has two failure modes — releasing too early
 * (survivor loses the var) and never reaching zero (the var is stranded on the
 * document forever). Both are covered by assertions in `docs/e2e/stress.mjs` (repo root).
 *
 * TWO TARGETS.
 *
 * - `'root'`: an ordinary (inherited) property on `document.documentElement`. Every
 *   element on the page inherits it — so CHANGING it makes the browser restyle every
 *   element on the page. Fine for a value that is set once (the nav height); ruinous for
 *   one that changes on a click: a sidebar collapsing on a page with a large table froze
 *   Chrome for ~1.1–1.6s per toggle, restyling ~6,600 elements to move one padding.
 * - `'content'`: the value lives in ONE rule of a library-owned stylesheet that matches
 *   only the elements marked as layout content (`.mono-layout-content`,
 *   `[mono-layout-content]`, `[mono-sidebar-push]`), and the property is registered as
 *   NON-inheriting. A change restyles exactly those elements (measured: 2 elements, ~15ms
 *   for the same toggle). A rule rather than inline styles so content mounted later — a
 *   layout swap — is covered without anyone looking for it. Registered with syntax `*`
 *   and no initial value, so an unset property is still "guaranteed-invalid" and a
 *   consumer's `var(--x, fallback)` keeps working. A child that needs the value (a
 *   `::before` seam drawn at the content's edge) takes it with `--x: inherit`.
 */

export type LayoutVarTarget = 'root' | 'content'

/** The elements a `'content'` variable applies to — the layout content markers. */
export const LAYOUT_CONTENT_SELECTOR = '.mono-layout-content, [mono-layout-content], [mono-sidebar-push]'

/** Per target + property: which owners hold it, and the value each last published. */
const owners = new Map<string, Map<object, string>>()

const key = (name: string, target: LayoutVarTarget) => `${target}:${name}`

/**
 * Publish `value` for `name` on behalf of `owner`.
 *
 * Re-claiming with the same owner just updates that owner's value, so this is safe
 * to call on every render.
 */
export function claimLayoutVar(name: string, owner: object, value: string, target: LayoutVarTarget = 'root'): void {
  if (typeof document === 'undefined') return

  let held = owners.get(key(name, target))
  if (!held) {
    held = new Map()
    owners.set(key(name, target), held)
  }
  held.set(owner, value)

  write(name, target, value)
}

/**
 * Drop `owner`'s claim on `name`.
 *
 * The property is only removed once nobody holds it; while another owner remains,
 * that owner's last published value is restored instead.
 */
export function releaseLayoutVar(name: string, owner: object, target: LayoutVarTarget = 'root'): void {
  if (typeof document === 'undefined') return

  const held = owners.get(key(name, target))
  if (!held) return

  held.delete(owner)

  if (held.size === 0) {
    owners.delete(key(name, target))
    write(name, target, null)
    return
  }

  const remaining = [...held.values()]
  write(name, target, remaining[remaining.length - 1]!)
}

function write(name: string, target: LayoutVarTarget, value: string | null): void {
  const style = target === 'root' ? documentRoot()?.style : contentRule(name)?.style
  if (!style) return
  if (value === null) style.removeProperty(name)
  else if (style.getPropertyValue(name) !== value) style.setProperty(name, value)
}

/**
 * `document.documentElement`, or null when there is no document to write to.
 *
 * `releaseLayoutVar` is called from `disconnectedCallback`, and a component can be
 * disconnected by the document itself going away — a full-document replacement, or a
 * page teardown. The root is already null by then, so the unguarded write threw
 * "Cannot read properties of null (reading 'style')" out of an unmount nothing could
 * catch. The bookkeeping above still runs; only the DOM write is skipped, and there is
 * no document left for the property to be stranded on.
 */
function documentRoot(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement
}

let contentStyleEl: HTMLStyleElement | null = null
const registered = new Set<string>()

/**
 * The one rule `'content'` variables are written into — created on first use, and again if
 * the document dropped the `<style>` (a full-document replacement). Also registers `name`
 * as non-inheriting, which is what keeps a change from reaching the content's subtree.
 */
function contentRule(name: string): CSSStyleRule | null {
  if (typeof document === 'undefined' || !document.head) return null
  if (!registered.has(name)) {
    registered.add(name)
    try {
      CSS.registerProperty({ name, syntax: '*', inherits: false })
    } catch {
      // Already registered (a second copy of the library, or an `@property` in a sheet) —
      // or no `CSS.registerProperty` at all; the rule below still applies the value.
    }
  }
  if (!contentStyleEl || !contentStyleEl.isConnected) {
    contentStyleEl = document.createElement('style')
    contentStyleEl.setAttribute('data-mono-layout-content', '')
    contentStyleEl.textContent = `${LAYOUT_CONTENT_SELECTOR} {}`
    document.head.appendChild(contentStyleEl)
    // A recreated rule starts empty: put back every value still held.
    const rule = contentStyleEl.sheet?.cssRules[0] as CSSStyleRule | undefined
    for (const [k, held] of owners) {
      if (!k.startsWith('content:') || !held.size) continue
      const values = [...held.values()]
      rule?.style.setProperty(k.slice('content:'.length), values[values.length - 1]!)
    }
  }
  return (contentStyleEl.sheet?.cssRules[0] as CSSStyleRule | undefined) ?? null
}
