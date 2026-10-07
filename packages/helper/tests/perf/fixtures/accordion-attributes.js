import '@mono-lit/helper/ui/accordion'
import '@mono-lit/helper/ui/shadow/accordion'

/**
 * `<mono-accordion>` after the Basecoat port: the item is upstream's
 * `.accordion > details` and the group is `.accordion`, so an item in a group
 * loses its frame and keeps only the hairline to the next one. None of that is
 * visible to a unit test — it is computed style, and half of it lives behind a
 * shadow boundary.
 */
// The page ships vega + the basecoat palette (see run.mjs), so what is measured
// here is the port's reference look rather than ONE's identity.
document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')

const ITEMS = [
  { label: 'One', body: 'First body' },
  { label: 'Two', body: 'Second body' },
  { label: 'Three', body: 'Third body' },
]

function mk(tag, props = {}, parent = document.getElementById('app')) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) el[k] = v
  const body = document.createElement('div')
  body.textContent = 'Body copy'
  el.appendChild(body)
  parent.appendChild(el)
  return el
}

// standalone, one per build
const standalone = {
  light: mk('mono-accordion', { id: 'light-solo', title: 'Solo' }),
  shadow: mk('mono-shadow-accordion', { id: 'shadow-solo', title: 'Solo' }),
}

// a group, one per build
const groups = {}
for (const [build, tag] of [['light', 'mono-accordion'], ['shadow', 'mono-shadow-accordion']]) {
  const group = document.createElement('div')
  group.setAttribute('mono-accordion-group', '')
  group.id = `${build}-group`
  document.getElementById('app').appendChild(group)
  groups[build] = ITEMS.map((i) => mk(tag, { title: i.label }, group))
}

// the hand-written twin of the group, in raw attribute markup
const raw = document.createElement('div')
raw.setAttribute('mono-accordion-group', '')
raw.id = 'raw-group'
raw.innerHTML = ITEMS.map(
  (i) => `
  <div mono-accordion>
    <button mono-head type="button" aria-expanded="false">
      <span mono-heading><span mono-title>${i.label}</span></span>
      <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></span>
    </button>
    <div mono-body role="region"><div>${i.body}</div></div>
  </div>`,
).join('')
document.getElementById('app').appendChild(raw)

/** The root of an element, whichever build it is. */
const rootOf = (el) =>
  el.shadowRoot?.querySelector('[mono-accordion]') ?? el.querySelector('[mono-accordion]')

const px = (v) => Math.round(parseFloat(v) || 0)

/**
 * `outer` is the group's own CHILD — the custom-element host when the element
 * renders the item, the item itself in hand-written markup. The DIVIDER lives
 * there (that is what makes `:last-child` reliable), so it has to be measured
 * there too.
 */
function metrics(root, outer = root) {
  const head = root.querySelector('[mono-head]')
  const title = root.querySelector('[mono-title]')
  const arrow = root.querySelector('[mono-arrow]')
  const body = root.querySelector('[mono-body]')
  const cs = getComputedStyle
  return {
    attrs: [...root.attributes]
      .filter((a) => a.name.startsWith('mono-'))
      .map((a) => (a.value ? `${a.name}=${a.value}` : a.name))
      .sort(),
    radius: px(cs(root).borderTopLeftRadius),
    borderTop: px(cs(root).borderTopWidth),
    borderBottom: px(cs(root).borderBottomWidth),
    divider: px(cs(outer).borderBottomWidth),
    shadow: cs(root).boxShadow,
    headPadding: [px(cs(head).paddingTop), px(cs(head).paddingLeft)],
    titleFont: px(cs(title).fontSize),
    titleLineHeight: px(cs(title).lineHeight),
    titleWeight: cs(title).fontWeight,
    arrow: px(cs(arrow).width),
    arrowRotate: cs(arrow).rotate,
    bodyFont: px(cs(body).fontSize),
    bodyPaddingBottom: px(cs(body).paddingBottom),
    bodyRows: cs(body).gridTemplateRows,
  }
}

window.__solo = (build) => metrics(rootOf(standalone[build]))

window.__group = (build) => groups[build].map((el) => metrics(rootOf(el), el))

window.__raw = () => [...raw.querySelectorAll('[mono-accordion]')].map((el) => metrics(el))

/** Open one item and report what its body and chevron did. */
window.__open = async (build) => {
  const el = standalone[build]
  el.modelValue = true
  await el.updateComplete
  await new Promise((r) => setTimeout(r, 400))
  return metrics(rootOf(el))
}

window.__ready = true
