// Size attributes — `mono-width` / `mono-min-width` / `mono-max-width` on ANY element.
//
//   <th mono-width="auto" mono-min-width="90" mono-max-width="220">JAN</th>
//   <div mono-width="auto" mono-max-width="20rem">…</div>
//   <div mono-width="240" mono-min-width="10rem">…</div>
//
// The plain-markup twin of `mono-table-th`'s `width` / `min-width` / `max-width`, for markup no
// mono element owns. A number (or bare numeric string) is px; any other length is used as-is.
//
// - On a TABLE CELL (`th` / `td`) they size the COLUMN. `mono-width="auto"` hands the column to
//   `ColumnAutoSize` — measured to its header, body and footer content, clamped to the bounds and
//   written as px to its `<col>` + cell — which is what makes it work under `mono-table-fixed`,
//   where CSS `auto` would swallow the surplus. A fixed width is written to the cell.
// - On ANY OTHER element they are plain CSS: `auto` is `fit-content` (shrink to the content,
//   capped by `mono-max-width`), the bounds go to `min-width` / `max-width`.
//
// One document-level observer, started by `createMonoUI()` and by `mono-table-th`, covers elements
// that mount later and attributes that change (`:mono-width="…"`). Browser only.
import { toCssSize } from './css-size'
import { ColumnAutoSize, cssLengthToPx } from '../components/table/column-autosize'

const ATTRS = ['mono-width', 'mono-min-width', 'mono-max-width'] as const
const SELECTOR = ATTRS.map((a) => `[${a}]`).join(', ')

/** Auto-sized cells and their sizers — a cell that loses `auto` or the document gets stopped. */
const sizers = new Map<HTMLElement, ColumnAutoSize>()
let observer: MutationObserver | null = null

const isCell = (el: Element) => el.tagName === 'TH' || el.tagName === 'TD'

/** Apply the three attributes to one element. Re-run whenever one of them changes. */
export function applyMonoSizeAttributes(el: HTMLElement): void {
  const width = el.getAttribute('mono-width')?.trim() ?? ''
  const min = el.getAttribute('mono-min-width')?.trim() ?? ''
  const max = el.getAttribute('mono-max-width')?.trim() ?? ''
  const auto = width.toLowerCase() === 'auto'

  el.style.minWidth = min ? (toCssSize(min) ?? '') : ''
  el.style.maxWidth = max ? (toCssSize(max) ?? '') : ''

  if (!isCell(el)) {
    el.style.width = auto ? 'fit-content' : width ? (toCssSize(width) ?? '') : ''
    return
  }

  let sizer = sizers.get(el)
  if (!auto) {
    if (sizer) {
      sizer.stop(true)
      sizers.delete(el)
    }
    el.style.width = width ? (toCssSize(width) ?? '') : ''
    return
  }
  if (!sizer) sizers.set(el, (sizer = new ColumnAutoSize(el)))
  sizer.min = cssLengthToPx(min || null, el)
  sizer.max = cssLengthToPx(max || null, el)
  sizer.schedule()
}

/** Stop the sizers of cells that left the document. */
function sweep(): void {
  for (const [el, sizer] of sizers) {
    if (el.isConnected) continue
    sizer.stop()
    sizers.delete(el)
  }
}

function scan(root: ParentNode): void {
  if (root instanceof HTMLElement && root.matches(SELECTOR)) applyMonoSizeAttributes(root)
  for (const el of Array.from(root.querySelectorAll<HTMLElement>(SELECTOR))) applyMonoSizeAttributes(el)
}

/**
 * Turn the attributes on for the whole document — idempotent, so every caller may call it.
 * Returns a stop function (tests; an app never needs it).
 */
export function startMonoSizeAttributes(): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return () => {}
  if (!observer) {
    observer = new MutationObserver((records) => {
      let removed = false
      for (const r of records) {
        if (r.type === 'attributes') {
          applyMonoSizeAttributes(r.target as HTMLElement)
          continue
        }
        for (const node of Array.from(r.addedNodes)) if (node.nodeType === 1) scan(node as Element)
        if (r.removedNodes.length) removed = true
      }
      if (removed) sweep()
    })
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    })
    scan(document)
  }
  return stopMonoSizeAttributes
}

export function stopMonoSizeAttributes(): void {
  observer?.disconnect()
  observer = null
  for (const sizer of sizers.values()) sizer.stop()
  sizers.clear()
}
