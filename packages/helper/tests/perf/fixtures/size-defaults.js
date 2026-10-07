// Fixture for the "class-less markup must equal size=md" audit.
//
// Each component renders three times through its real element — size unset, md, lg —
// and the unset one has its size class stripped off the rendered root afterwards.
// That models raw `.mono-*` markup written by hand (or by a css/ demo) that never
// named a size, without having to guess each component's internal DOM.
//
// Sizing is expressed two different ways in this library, so both are captured:
//   - most components resolve `--_mono-<c>-*` vars on the root (set via `-preset`)
//   - the control-like ones set real properties on an inner element
// Chrome does NOT enumerate custom properties via `Array.from(getComputedStyle(el))`,
// so the var names have to be listed explicitly.

import { createApp, defineComponent, nextTick } from 'vue'
import '@mono-lit/helper/ui/accordion'
import '@mono-lit/helper/ui/breadcrumb'
import '@mono-lit/helper/ui/dropdown'
import '@mono-lit/helper/ui/tabs'
import '@mono-lit/helper/ui/date'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/drawer'

const v = (c, ...names) => names.map((n) => `--_mono-${c}-${n}`)

export const TARGETS = {
  'mono-accordion': {
    root: 'mono-accordion',
    vars: v('accordion', 'radius', 'pad-x', 'pad-y'),
    inners: ['.mono-accordion-head', '.mono-accordion-title', '.mono-accordion-icon', '.mono-accordion-body'],
  },
  'mono-breadcrumb': {
    root: 'mono-breadcrumb',
    vars: v('breadcrumb', 'pad-x', 'pad-y', 'gap', 'radius', 'font', 'icon-size', 'sep-font'),
    inners: [],
  },
  'mono-dropdown': {
    root: 'mono-dropdown',
    vars: v('dropdown', 'radius', 'pad-x', 'pad-y', 'font', 'min-width', 'max-width', 'offset'),
    inners: [],
  },
  'mono-tabs': {
    root: 'mono-tabs',
    vars: v('tabs', 'pad-x', 'pad-y', 'font', 'gap'),
    inners: ['.mono-tabs-tab-icon > svg'],
  },
  'mono-date': {
    root: 'mono-date',
    vars: [],
    inners: ['.mono-date-field', '.mono-date-native'],
  },
  'mono-dropdown-table': {
    root: 'mono-dropdown-table',
    vars: [],
    inners: ['.mono-dropdown-table-trigger', '.mono-dropdown-table-value'],
  },
  'mono-select': {
    root: 'mono-select',
    vars: [],
    inners: ['.mono-select-trigger', '.mono-select-value'],
  },
  'mono-tag-input': {
    root: 'mono-tag-input',
    vars: [],
    inners: ['.mono-tag-input-field', '.mono-tag-input-native'],
  },
  'mono-button': {
    root: 'mono-button',
    vars: [],
    inners: ['button'],
  },
  // `size` on modal/drawer is the CONTENT scale (padding + type + close + radius),
  // NOT the panel's dimensions — those are the `width`/`height` props. So the vars
  // measured here are deliberately the typography/spacing ones; width and height
  // must stay constant across sizes and are asserted separately.
  'mono-modal': {
    root: 'mono-modal',
    vars: v('modal', 'radius', 'pad-x', 'head-pad-y', 'foot-pad-y', 'title-font', 'body-font', 'close-size'),
    inners: [],
  },
  'mono-drawer': {
    root: 'mono-drawer',
    vars: v('drawer', 'pad-x', 'pad-y', 'font', 'title-font', 'icon-size'),
    inners: [],
  },
}

const App = defineComponent({
  template: `
    <div>
      ${Object.entries(TARGETS)
        .map(([tag, spec]) =>
          ['unset', 'md', 'lg']
            .map(
              (s) =>
                `<${tag} data-t="${tag}|${s}" label="Label" title="Title" placeholder="ph" ${
                  spec.attrs ?? ''
                }${s === 'unset' ? '' : ` size="${s}"`}>text</${tag}>`,
            )
            .join(''),
        )
        .join('')}
    </div>`,
})

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (t) => t.startsWith('mono-')
app.mount('#app')

// Three shapes to cover: drawer portals its root to <body> (`_portal`), dropdown puts
// the root classes on the HOST itself, everyone else renders a child root div.
const rootOf = (host, rootClass) => {
  if (!host) return null
  if (host._portal) return host._portal
  if (host.classList?.contains(rootClass)) return host
  return (
    host.shadowRoot?.querySelector('.' + rootClass) ?? host.querySelector('.' + rootClass) ?? null
  )
}

const SIZE_CLASSES = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

/**
 * Strip size classes from the root AND every descendant.
 *
 * Not all components put the size class on the root: `date` sizes
 * `.mono-date-field`, `select` sizes `.mono-select-trigger`, `tag-input` sizes
 * `.mono-tag-input-field`. Stripping only the root leaves those still at `md` and the
 * "unset" arm silently measures `md` — which is exactly the false pass this fixture
 * exists to avoid.
 */
const stripSizes = (root) => {
  if (!root) return
  root.classList.remove(...SIZE_CLASSES)
  for (const el of root.querySelectorAll('*')) el.classList.remove(...SIZE_CLASSES)
}

const GEOMETRY = [
  'fontSize',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopLeftRadius',
  'minHeight',
  'width',
  'height',
  'gap',
]

const snapshot = (host, spec) => {
  const root = rootOf(host, spec.root)
  if (!root) return { error: 'root not found' }

  const cs = getComputedStyle(root)
  const out = {}
  for (const name of spec.vars) out[name] = cs.getPropertyValue(name).trim() || 'EMPTY'

  for (const sel of spec.inners) {
    const el = root.querySelector(sel)
    if (!el) {
      out[sel] = 'MISSING'
      continue
    }
    const s = getComputedStyle(el)
    out[sel] = GEOMETRY.map((p) => s[p]).join(' | ')
  }
  return out
}

window.__snapshotAll = async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 300))

  for (const [tag, spec] of Object.entries(TARGETS)) {
    stripSizes(rootOf(document.querySelector(`[data-t="${tag}|unset"]`), spec.root))
  }
  await new Promise((r) => setTimeout(r, 150))

  const out = {}
  for (const [tag, spec] of Object.entries(TARGETS)) {
    out[tag] = {}
    for (const s of ['unset', 'md', 'lg']) {
      out[tag][s] = snapshot(document.querySelector(`[data-t="${tag}|${s}"]`), spec)
    }
  }
  return out
}

/**
 * Panel width per size for the portaled panels.
 *
 * The point of the `size` redefinition: it scales the CONTENT, so the panel's width
 * must be identical at every step. If a width preset ever creeps back into a size
 * rule, these stop matching.
 */
window.__panelWidths = (tag, kind) =>
  ['unset', 'md', 'lg'].map((s) => {
    const root = rootOf(document.querySelector(`[data-t="${tag}|${s}"]`), tag.replace('mono-', 'mono-'))
    const panel = root?.querySelector(`.${kind}-panel`)
    return panel ? Math.round(parseFloat(getComputedStyle(panel).width)) : null
  })

/**
 * Dimension PRESETS — the `xs`…`xxl` tokens `width`/`height` accept.
 *
 * Same spelling as the `size` tokens, different axis: `size` scales the content and
 * must leave the measure alone (asserted above), while these name the measure and
 * must leave the content alone.
 *
 * The token is compared against the LITERAL length it is documented to resolve to,
 * measured on the same element, rather than a hardcoded number — the width presets
 * carry a `min(90vw, …)` clamp, so a fixed expectation would encode the harness
 * viewport instead of the contract.
 *
 * Measures `getComputedStyle().width`, NOT `getBoundingClientRect()`: a closed modal
 * panel sits at `scale(0.97)` for its open animation, and the rect includes that
 * transform — a 880px panel reads back as 854.
 *
 * Mutates the `unset` instance, so it has to run after `__snapshotAll`.
 */
window.__dimensionPreset = async (tag, kind, prop, token, literal) => {
  const host = document.querySelector(`[data-t="${tag}|unset"]`)
  if (!host) return { error: 'host not found' }

  const root = rootOf(host, tag)
  const panel = root?.querySelector(`.${kind}-panel`)
  if (!panel) return { error: 'panel not found' }

  const axis = prop === 'width' ? 'width' : 'height'
  const measure = () => Math.round(parseFloat(getComputedStyle(panel)[axis]))
  const settle = async () => {
    await host.updateComplete
    await new Promise((r) => requestAnimationFrame(r))
  }

  host.size = 'sm'
  host[prop] = token
  await settle()
  const withToken = measure()
  // The PAINTED padding of whatever box the component pads — the panel itself
  // for a ported dialog, the body for one still on the pre-port ladder.
  const padded = panel.querySelector(`.${kind}-body`) ?? panel
  const padX =
    Math.round(parseFloat(getComputedStyle(panel).paddingLeft)) ||
    Math.round(parseFloat(getComputedStyle(padded).paddingLeft))

  host[prop] = literal
  await settle()
  const withLiteral = measure()

  host[prop] = undefined
  await settle()
  const cleared = measure()

  return { withToken, withLiteral, cleared, padX }
}

window.__ready = true
