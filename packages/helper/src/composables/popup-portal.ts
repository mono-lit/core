// @unocss-include

import { isServer } from 'lit'
import type { ReactiveController, ReactiveControllerHost } from 'lit'

import {
  registerPopupLayer,
  unregisterPopupLayer,
  type PopupLayer,
} from './popup-stack'

/* =========================================================================
   Popup portal controller
   -------------------------------------------------------------------------
   Lightweight inline popups (dropdown / select / tag-input) render their panel
   as a light-DOM child of the host. That traps the panel inside whatever
   stacking context an ancestor establishes (a card with `transform` / `opacity`
   / `contain` / `z-index` …), so the shared popup-stack z-index can't rank it
   against popups living under a different ancestor.

   This controller relocates the already-rendered panel into a `<div>` portal
   appended to `<body>` while the popup is open — the root stacking context,
   where the z-chain is authoritative (the same trick modal/drawer use). It also
   owns the popup-stack membership for the host (setting `--mono-popup-z` on the
   portal) and positions the panel with `position: fixed` against its anchor.

   Light-DOM only: a shadow-DOM host (e.g. the `mono-dropdown` shadow build)
   keeps its panel in the shadow root — body-portaled nodes would lose the
   shadow-scoped styles — and the controller just positions it in place.
   ========================================================================= */

type PopupHost = ReactiveControllerHost &
  HTMLElement & { readonly renderRoot: HTMLElement | DocumentFragment }

export type PopupSide = 'top' | 'bottom' | 'left' | 'right'
export type PopupAlign = 'start' | 'center' | 'end'

export interface PopupPortalOptions {
  /** Locate the panel element (searched in the host's render root). */
  getPanel: () => HTMLElement | null
  /** Element the panel is anchored to (the trigger / field). */
  getAnchor: () => HTMLElement | null
  /**
   * Element whose class list AND `mono-*` attributes are mirrored onto the portal
   * so the relocated panel keeps its theme CSS variables and state-dependent
   * styles — the legacy `.mono-select.open .mono-select-dropdown` rule and the
   * Basecoat-ported `[mono-select][mono-open] > [mono-dropdown]` one alike, with
   * the `--_mono-<c>-*` resolvers declared on `[mono-<c>]` re-resolving on the
   * portal. Usually the host or its inner wrapper `<div>`.
   */
  getStyleScope: () => HTMLElement | null
  /**
   * The component's PUBLIC custom-property names, so a relocated panel keeps
   * overrides an ancestor of the host set.
   *
   * Class and attribute mirroring is not enough for these: a custom property is
   * inherited, and a portaled panel is a child of `<body>`, so
   * `--mono-dropdown-radius` set on a wrapper around the host simply is not in
   * its inheritance chain any more. `getComputedStyle` cannot enumerate custom
   * properties (Chromium lists none of them), so the component has to name the
   * ones it reads; each is resolved on the scope and copied onto the portal when
   * it differs from what the portal already resolves.
   */
  styleVars?: () => readonly string[]
  /** Whether the popup is currently open. */
  isOpen: () => boolean
  side?: () => PopupSide
  align?: () => PopupAlign
  offset?: () => number
  flip?: () => boolean
  shift?: () => boolean
  /** Panel width tracks the anchor's width (select / tag-input full-width drop). */
  /**
   * Stretch the panel to the anchor's width on every reposition.
   *
   * A GETTER as well as a plain boolean, because a component may want it to follow a prop: a
   * consumer that sets an explicit panel width needs this off, or the write below overwrites it
   * on the next open / scroll / resize.
   */
  matchWidth?: boolean | (() => boolean)
  /**
   * Publish the room available on the resolved side as `--mono-popup-avail-h`
   * (main axis) / `--mono-popup-avail-w` (cross axis) on the panel, so its CSS
   * can shrink instead of spilling off-screen. See {@link applyPopupPlacement}.
   */
  constrainSize?: () => boolean
  /** Notified when the resolved side changes after flipping. */
  onSideResolved?: (side: PopupSide) => void
}

/* =========================================================================
   Placement math (shared)
   -------------------------------------------------------------------------
   Extracted from the controller so the SHADOW builds — which keep their panel
   in the shadow root and therefore never go through `reposition()` (see
   `_canPortal`) — can run the exact same algorithm instead of hand-rolling a
   weaker copy.
   ========================================================================= */

export interface PopupPlacementOptions {
  side?: PopupSide
  align?: PopupAlign
  offset?: number
  flip?: boolean
  shift?: boolean
  /** Gap kept between the panel and the viewport edge. */
  margin?: number
  /**
   * The caller will clamp the panel to `availableMain` (see `constrainSize`), so
   * anchor a flipped/`top`-side panel to the CLAMPED extent rather than its
   * natural one. Off by default: an unconstrained panel keeps its natural size,
   * and pretending otherwise would slide it over its own trigger.
   */
  constrain?: boolean
}

export interface PopupPlacement {
  top: number
  left: number
  /** The side actually used (may differ from the preferred one after flipping). */
  side: PopupSide
  /**
   * Room between the anchor and the viewport edge along the panel's main axis
   * on the resolved side — height for top/bottom, width for left/right.
   */
  availableMain: number
}

/** Smallest height we will ever constrain a panel to — below this it's unusable. */
const MIN_CONSTRAINED = 96

/** Composed-tree parent — crosses shadow boundaries. */
function flatTreeParent(node: Node): Node | null {
  const slot = (node as Element).assignedSlot
  if (slot) return slot
  const parent = node.parentNode
  if (parent instanceof ShadowRoot) return parent.host
  return parent
}

/** Composed-tree containment — `root.contains(node)` that crosses shadow roots and slots. */
function flatTreeContains(root: Node, node: Node): boolean {
  for (let n: Node | null = node; n; n = flatTreeParent(n)) if (n === root) return true
  return false
}

/**
 * Which element OPENED a body-level portal.
 *
 * Every portal is a direct child of `<body>`, so the DOM says nothing about
 * where its popup came from — and a popup opened from inside another popup's
 * panel (a header filter inside a dropdown-table, a select inside a modal) is
 * then "outside" to that panel's own dismiss test, which closes it under the
 * user's hands. This map is the missing link, kept off the DOM (no attribute,
 * nothing to serialise) and weak so a torn-down portal is not held.
 */
const portalOwner = new WeakMap<Element, Element>()

/** The portal `node` currently lives in (composed tree), or `null` when it is not inside one. */
function flatTreeClosestPortal(node: Node): Element | null {
  for (let n: Node | null = flatTreeParent(node); n; n = flatTreeParent(n)) {
    if (n instanceof Element && n.hasAttribute('data-mono-popup-portal')) return n
  }
  return null
}

/**
 * True when an event's composed path passes through any of `roots` — directly,
 * or through a body-level popup portal whose OWNER lives inside one of them (at
 * any depth: a select inside a header filter inside a dropdown-table resolves
 * all the way up).
 *
 * The one "is this click inside me?" test the library uses. Popups ask it
 * through `PopupPortalController.containsInPath`; `mono-modal` / `mono-drawer`
 * — which portal themselves, not through this controller — ask it directly with
 * their host + render root, so a click in a select's option list opened from
 * inside a no-overlay dialog counts as inside the dialog.
 */
export function pathOwnedBy(path: EventTarget[], roots: readonly Element[]): boolean {
  if (path.some((node) => node instanceof Element && roots.includes(node))) return true
  return nestedPortalInPath(path, roots)
}

/**
 * The portal half of `pathOwnedBy`: true when the path passes through a
 * `[data-mono-popup-portal]` whose owner chain lands in one of `roots` — the
 * roots themselves being in the path does NOT count. That distinction is what
 * `ownsNestedInPath` is built on: an Escape with focus on a dropdown's own
 * trigger is the dropdown's to close, not a nested popup's.
 */
function nestedPortalInPath(path: EventTarget[], roots: readonly Element[]): boolean {
  for (const node of path) {
    if (!(node instanceof Element) || !node.hasAttribute('data-mono-popup-portal')) continue
    let owner: Element | undefined = portalOwner.get(node)
    const seen = new Set<Element>()
    while (owner && !seen.has(owner)) {
      seen.add(owner)
      if (roots.some((root) => root === owner || flatTreeContains(root, owner!))) return true
      const outer = flatTreeClosestPortal(owner)
      owner = outer ? portalOwner.get(outer) : undefined
    }
  }
  return false
}

/**
 * Nearest ancestor of the panel that establishes a containing block for
 * `position: fixed` descendants. A body-portaled panel has none (the portal is
 * a direct child of `<body>`), but a shadow-root panel usually sits under app
 * chrome that does.
 */
export function findFixedContainingBlock(panel: HTMLElement): HTMLElement | null {
  let node = flatTreeParent(panel)
  while (node && node !== document.body && node !== document.documentElement) {
    if (node instanceof HTMLElement) {
      const cs = getComputedStyle(node)
      if (cs.transform && cs.transform !== 'none') return node
      if (cs.perspective && cs.perspective !== 'none') return node
      if (cs.filter && cs.filter !== 'none') return node
      const backdrop =
        cs.backdropFilter ||
        (cs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter
      if (backdrop && backdrop !== 'none') return node
      const willChange = cs.willChange || ''
      if (
        willChange.includes('transform') ||
        willChange.includes('perspective') ||
        willChange.includes('filter')
      ) {
        return node
      }
      const contain = cs.contain || ''
      if (
        contain.includes('paint') ||
        contain.includes('layout') ||
        contain.includes('strict') ||
        contain.includes('content')
      ) {
        return node
      }
    }
    node = flatTreeParent(node)
  }
  return null
}

/**
 * Resolve where `panel` should sit relative to `anchor`, in viewport
 * coordinates (i.e. what `position: fixed` wants, before any containing-block
 * compensation — that's {@link applyPopupPlacement}'s job).
 *
 * IMPORTANT — the panel is measured at its NATURAL size: any previously
 * published `--mono-popup-avail-*` constraint is cleared first. A constrained
 * panel is exactly as tall as the room we gave it, so measuring it that way
 * would make the flip test (`spaceBelow < panelH`) always report "it fits" and
 * the panel would oscillate between sides on every scroll tick.
 */
export function computePopupPlacement(
  anchor: HTMLElement,
  panel: HTMLElement,
  o: PopupPlacementOptions = {},
): PopupPlacement {
  panel.style.removeProperty('--mono-popup-avail-h')
  panel.style.removeProperty('--mono-popup-avail-w')

  const triggerRect = anchor.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = o.margin ?? 4

  // Measure what the panel PAINTS, not merely its own box. When slotted content is
  // wider than the panel's `max-width` (a `w-72` body against the md preset's 280px,
  // say) an `overflow: visible` panel still reports 280 while the ink reaches ~302 —
  // so every clamp below solved for the wrong rectangle and the extra ink landed off
  // screen no matter what `shift` did.
  //
  // Corrected per axis, and ONLY for an axis that does not scroll: where the panel
  // scrolls (a select list, a table body) the box IS the painted extent, and
  // `scrollWidth/Height` would report the entire list — which would make the flip
  // test read "doesn't fit" forever and oscillate the panel between sides.
  const cs = getComputedStyle(panel)
  const borderX =
    (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0)
  const borderY =
    (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
  const boxW = panelRect.width || panel.offsetWidth
  const boxH = panelRect.height || panel.offsetHeight
  const panelW = cs.overflowX === 'visible' ? Math.max(boxW, panel.scrollWidth + borderX) : boxW
  const panelH = cs.overflowY === 'visible' ? Math.max(boxH, panel.scrollHeight + borderY) : boxH

  let side: PopupSide = o.side ?? 'bottom'
  let align: PopupAlign = o.align ?? 'start'
  const offset = o.offset ?? 6
  const flip = o.flip ?? false
  const shift = o.shift ?? false
  const constrain = o.constrain ?? false

  /** Extent the panel will actually occupy along the main axis once clamped. */
  const clamped = (natural: number, available: number): number =>
    constrain ? Math.min(natural, Math.max(MIN_CONSTRAINED, available)) : natural

  if (flip) {
    if (side === 'bottom') {
      const below = vh - triggerRect.bottom - offset
      const above = triggerRect.top - offset
      if (below < panelH && above > below) side = 'top'
    } else if (side === 'top') {
      const above = triggerRect.top - offset
      const below = vh - triggerRect.bottom - offset
      if (above < panelH && below > above) side = 'bottom'
    } else if (side === 'right') {
      const right = vw - triggerRect.right - offset
      const left = triggerRect.left - offset
      if (right < panelW && left > right) side = 'left'
    } else if (side === 'left') {
      const left = triggerRect.left - offset
      const right = vw - triggerRect.right - offset
      if (left < panelW && right > left) side = 'right'
    }
  }

  // Cross-axis flip. `flip` used to cover only the main axis (bottom<->top), so a
  // `bottom-start` panel next to the right edge stayed start-aligned and `shift`
  // dragged it along the viewport edge — inside the screen, but visually unhooked
  // from its trigger. Re-anchoring to the trigger's OPPOSITE edge is what a menu is
  // expected to do: near the right edge it opens leftwards, i.e. behaves as
  // `bottom-end`. `shift` stays the backstop for a panel too wide for either side.
  if (flip && align !== 'center') {
    const fitsStart =
      side === 'bottom' || side === 'top'
        ? triggerRect.left + panelW + margin <= vw
        : triggerRect.top + panelH + margin <= vh
    const fitsEnd =
      side === 'bottom' || side === 'top'
        ? triggerRect.right - panelW - margin >= 0
        : triggerRect.bottom - panelH - margin >= 0

    if (align === 'start' && !fitsStart && fitsEnd) align = 'end'
    else if (align === 'end' && !fitsEnd && fitsStart) align = 'start'
  }

  let top = 0
  let left = 0
  let availableMain = 0

  if (side === 'bottom' || side === 'top') {
    if (align === 'start') left = triggerRect.left
    else if (align === 'end') left = triggerRect.right - panelW
    else left = triggerRect.left + triggerRect.width / 2 - panelW / 2

    if (shift) {
      const minLeft = margin
      const maxLeft = vw - panelW - margin
      if (maxLeft >= minLeft) {
        if (left < minLeft) left = minLeft
        if (left > maxLeft) left = maxLeft
      }
    }

    availableMain =
      side === 'bottom'
        ? vh - triggerRect.bottom - offset - margin
        : triggerRect.top - offset - margin

    top =
      side === 'bottom'
        ? triggerRect.bottom + offset
        : triggerRect.top - clamped(panelH, availableMain) - offset
  } else {
    if (align === 'start') top = triggerRect.top
    else if (align === 'end') top = triggerRect.bottom - panelH
    else top = triggerRect.top + triggerRect.height / 2 - panelH / 2

    if (shift) {
      const minTop = margin
      const maxTop = vh - panelH - margin
      if (maxTop >= minTop) {
        if (top < minTop) top = minTop
        if (top > maxTop) top = maxTop
      }
    }

    availableMain =
      side === 'right'
        ? vw - triggerRect.right - offset - margin
        : triggerRect.left - offset - margin

    left =
      side === 'right'
        ? triggerRect.right + offset
        : triggerRect.left - clamped(panelW, availableMain) - offset
  }

  return { top, left, side, availableMain }
}

/**
 * Commit a {@link computePopupPlacement} result to the panel. Compensates for a
 * transformed / contained ancestor that has become the fixed panel's containing
 * block (a no-op for a body-portaled panel), and — when `constrain` is set —
 * publishes the available room so the panel's own CSS can clamp itself.
 */
export function applyPopupPlacement(
  panel: HTMLElement,
  placement: PopupPlacement,
  constrain = false,
): void {
  let { top, left } = placement

  const cb = findFixedContainingBlock(panel)
  if (cb) {
    const cbRect = cb.getBoundingClientRect()
    top -= cbRect.top
    left -= cbRect.left
  }

  panel.style.position = 'fixed'
  // Snap to whole DEVICE pixels. The anchor's rect is fractional (page layout),
  // so an unsnapped panel starts mid-pixel and its 1px ring is split across two
  // rows at half strength each — on a dark surface, where the ring is already
  // only 20-26% opaque, that edge reads as missing. Rounding to the device grid
  // keeps the hairline on one row at any scale factor.
  const grid = typeof window !== 'undefined' && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1
  const snap = (v: number) => Math.round(v * grid) / grid
  panel.style.top = `${snap(top)}px`
  panel.style.left = `${snap(left)}px`
  panel.style.right = 'auto'
  panel.style.bottom = 'auto'
  panel.style.transform = 'none'

  if (constrain) {
    const avail = `${Math.round(Math.max(MIN_CONSTRAINED, placement.availableMain))}px`
    const vertical = placement.side === 'bottom' || placement.side === 'top'
    panel.style.setProperty(vertical ? '--mono-popup-avail-h' : '--mono-popup-avail-w', avail)
  }
}

export class PopupPortalController implements ReactiveController, PopupLayer {
  private _portal: HTMLElement | null = null
  /** Cached panel reference (it leaves the render root once adopted). */
  private _panel: HTMLElement | null = null
  private _adopted = false
  private _registered = false
  private _resolvedSide: PopupSide = 'bottom'
  /** Keeps the portal's mirrored class current even when the host applies its
   *  state classes imperatively in `updated()` (which runs *after* the
   *  controller's `hostUpdated`). */
  private _classObserver: MutationObserver | null = null
  /** Whether the viewport listeners are currently attached (open-only, see
   *  `_bindViewport`). Keeps the add/remove pair balanced across the several
   *  paths that can open or close a popup. */
  private _viewportBound = false
  /** Pending reposition frame, so a scroll burst costs one layout, not one per event. */
  private _viewportFrame = 0

  constructor(
    private readonly host: PopupHost,
    private readonly opts: PopupPortalOptions,
  ) {
    host.addController(this)
  }

  /* ----------------------------- lifecycle ----------------------------- */

  hostConnected(): void {
    if (isServer) return

    // Re-home an OPEN popup immediately. A plain reattach schedules no Lit update,
    // so `hostUpdated` may never run again — and the panel is still sitting in the
    // portal that `hostDisconnected` discarded, leaving a popup that reports itself
    // open but can never be seen. Harmless on the initial mount: nothing is open
    // yet, and `_adopt()` bails while `getPanel()` has nothing to return.
    if (this.opts.isOpen()) {
      this._adopt()
      this._enterStack()
      this._syncPortalClass()
      this.reposition()
    }
  }

  hostDisconnected(): void {
    // Safety net — `_leaveStack()` below normally does this. A host torn down while
    // its popup is open would otherwise strand a window listener.
    this._unbindViewport()
    this._leaveStack()
    this._classObserver?.disconnect()
    this._classObserver = null
    if (this._portal?.parentNode) {
      this._portal.parentNode.removeChild(this._portal)
    }
    this._portal = null
    // `_panel` is deliberately KEPT. The panel was moved out of the host's render
    // root on first open, so after a reconnect `getPanel()` can no longer find it
    // and `_adopt()` relies on this reference to re-home it. Nulling it here left
    // every popup that had been opened once permanently unable to reopen.
    this._adopted = false
  }

  hostUpdated(): void {
    if (isServer) return

    if (this.opts.isOpen()) {
      this._adopt()
      this._enterStack()
      this._syncPortalClass()
      this.reposition()
    } else {
      this._leaveStack()
      // Keep the portal's mirrored class in sync so the (still-adopted) panel
      // picks up the host losing its `open` class and hides itself.
      this._syncPortalClass()
    }
  }

  /* ------------------------------ portal ------------------------------- */

  /**
   * Only relocate to `<body>` when the host renders into light DOM
   * (`renderRoot === host`). Shadow hosts keep the panel in their shadow root.
   */
  private get _canPortal(): boolean {
    return !isServer && (this.host.renderRoot as unknown) === this.host
  }

  private _ensurePortal(): HTMLElement | null {
    if (this._portal) return this._portal
    if (typeof document === 'undefined') return null

    const portal = document.createElement('div')
    portal.setAttribute('data-mono-popup-portal', '')
    // `display: contents` → no box of its own, but custom properties still
    // inherit to the panel and descendant selectors (`.mono-select …`) match.
    portal.style.display = 'contents'
    document.body.appendChild(portal)
    portalOwner.set(portal, this.host)
    this._portal = portal
    return portal
  }

  /** Move the panel into the body portal on first open; keep it there after. */
  private _adopt(): void {
    if (this._adopted) return
    if (!this._canPortal) {
      // Shadow / SSR: position in place, remember the panel for repositioning.
      this._panel = this.opts.getPanel()
      return
    }

    // Fall back to the panel we already adopted. After a disconnect/reconnect the
    // node is no longer in the host's render root — `_adopt()` moved it into the
    // portal — so `getPanel()`, which nearly every call site implements as
    // `renderRoot.querySelector(...)`, returns null and the popup would never open
    // again. Lit does not recreate the node either: it is statically rendered, so
    // its ChildPart just keeps patching the one we hold.
    const panel = this.opts.getPanel() ?? this._panel
    if (!panel) return
    const portal = this._ensurePortal()
    if (!portal) return

    // Dress the portal BEFORE the panel enters it. Panel CSS is scoped under the
    // component root (`[mono-dropdown-table] [mono-dd-region="body"]`, …) and
    // only matches here once the root's classes / `mono-*` attributes are on the
    // portal. `appendChild` reconnects every element in the panel synchronously,
    // so anything that measures in `connectedCallback` (a pager finding its
    // scroll container, a loading overlay freezing a height) saw a bare,
    // unstyled panel when the mirror came after the move.
    this._syncPortalClass()
    this._observeStyleScope()
    portal.appendChild(panel)
    this._panel = panel
    this._adopted = true
  }

  /** Mirror the style-scope element's classes and `mono-*` attributes onto the portal. */
  private _syncPortalClass(): void {
    if (!this._portal) return
    const scope = this.opts.getStyleScope()
    const cls = scope?.getAttribute('class') ?? ''
    if (this._portal.getAttribute('class') !== cls) {
      this._portal.setAttribute('class', cls)
    }
    // Attribute-styled components (button, input, select, …) key their CSS on
    // `mono-*` attributes rather than classes; copy those too, and drop any the
    // scope no longer carries (`mono-open` when the panel closes).
    // `mono-tooltip-*` is the tooltip addon's per-element declaration, not
    // styling — mirrored, it would make the whole panel a tooltip anchor.
    const mirrored = (name: string) => name.startsWith('mono-') && !name.startsWith('mono-tooltip-')
    const wanted = new Map<string, string>()
    if (scope) {
      for (const a of Array.from(scope.attributes)) {
        if (mirrored(a.name)) wanted.set(a.name, a.value)
      }
    }
    for (const a of Array.from(this._portal.attributes)) {
      if (mirrored(a.name) && !wanted.has(a.name)) this._portal.removeAttribute(a.name)
    }
    for (const [name, value] of wanted) {
      if (this._portal.getAttribute(name) !== value) this._portal.setAttribute(name, value)
    }

    this._syncPortalVars(scope)
  }

  /**
   * Carry the component's public custom properties across the portal (see
   * `styleVars`). Only values that DIFFER from the portal's own resolution are
   * written, so a theme-level token stays inherited and only a real override
   * (an ancestor of the host, or an inline style on it) is copied.
   */
  private _syncPortalVars(scope: HTMLElement | null): void {
    const names = this.opts.styleVars?.()
    if (!this._portal || !scope || !names?.length) return
    const from = getComputedStyle(scope)
    const here = getComputedStyle(this._portal)
    for (const name of names) {
      const value = from.getPropertyValue(name)
      if (!value) {
        if (this._portal.style.getPropertyValue(name)) this._portal.style.removeProperty(name)
        continue
      }
      // compare against the portal WITHOUT its own copy, or the first write
      // would always look like it already matches
      const mine = this._portal.style.getPropertyValue(name) || here.getPropertyValue(name)
      if (mine !== value) this._portal.style.setProperty(name, value)
    }
  }

  /**
   * Watch the style-scope's `class` attribute so the portal stays in sync even
   * when the host toggles state classes (e.g. `open`) imperatively in
   * `updated()`, which runs after the controller's `hostUpdated`.
   */
  private _observeStyleScope(): void {
    if (this._classObserver || typeof MutationObserver === 'undefined') return
    const scope = this.opts.getStyleScope()
    if (!scope) return
    this._classObserver = new MutationObserver((records) => {
      if (records.some((r) => r.attributeName === 'class' || r.attributeName?.startsWith('mono-'))) {
        this._syncPortalClass()
      }
    })
    this._classObserver.observe(scope, { attributes: true })
  }

  /* ------------------------------- stack ------------------------------- */

  private _enterStack(): void {
    this._bindViewport()
    if (this._registered) return
    registerPopupLayer(this)
    this._registered = true
  }

  private _leaveStack(): void {
    this._unbindViewport()
    if (!this._registered) return
    unregisterPopupLayer(this)
    this._registered = false
  }

  /** PopupLayer hook — write the chained z onto the portal (root context). */
  setStackZ(z: number): void {
    const target = this._portal ?? this.host
    target.style.setProperty('--mono-popup-z', String(z))
  }

  /* ----------------------- queries / outside-click --------------------- */

  /** Where panel-internal elements live now (portal while adopted, else host). */
  get panelRoot(): ParentNode {
    return this._adopted && this._portal ? this._portal : this.host.renderRoot
  }

  /**
   * True when an event's composed path passes through this popup — its own
   * portaled panel, OR any popup that was opened from inside it.
   *
   * The second half is what keeps a nested popup from dismissing its parent:
   * a header filter opened from a `<mono-table-th>` in a dropdown-table's
   * panel, a select's option list inside a modal — each lives in a portal of
   * its own on `<body>`, so a click in it is nowhere near the parent in the
   * DOM. It IS inside by ownership, and that is what every outside-click test
   * in the library asks this method.
   */
  containsInPath(path: EventTarget[]): boolean {
    if (this._portal && path.includes(this._portal)) return true
    return this.ownsNestedInPath(path)
  }

  /**
   * True when the path passes through a popup opened from INSIDE this one
   * (at any depth) — not this popup's own panel.
   *
   * Walks each portal in the path back to its owner and asks whether that
   * owner lives in this host or this panel; an owner that is itself inside
   * another popup climbs to that popup's owner, so a select inside a filter
   * inside a dropdown-table resolves all the way up. Composed-tree
   * containment throughout: the owner may sit behind a slot or a shadow root.
   */
  ownsNestedInPath(path: EventTarget[]): boolean {
    // Own portal excluded from the path (that is `containsInPath`'s half), but
    // kept as a ROOT: a nested popup's owner may live inside this panel.
    const roots = this._portal ? [this.host, this._portal] : [this.host]
    return nestedPortalInPath(path.filter((n) => n !== this._portal), roots)
  }

  /* ----------------------------- positioning --------------------------- */

  /**
   * Listen for viewport movement — but ONLY while this popup is open.
   *
   * These used to be bound in `hostConnected`, which meant one capture-phase
   * `scroll` listener on `window` per popup-capable element on the page, open or
   * not: every select, every table header filter, every search box — and one per
   * ROW on a grid that puts a `mono-button-dropdown` in each. `_onViewport` bails
   * when closed, so the handler was free; the *dispatch* was not, and a
   * non-passive capture listener on `window` also disqualifies the whole page's
   * scrolling from running off the compositor thread.
   *
   * `passive` because nothing here calls `preventDefault`.
   */
  private _bindViewport(): void {
    if (isServer || this._viewportBound) return
    window.addEventListener('scroll', this._onViewport, { capture: true, passive: true })
    window.addEventListener('resize', this._onViewport, { passive: true })
    this._viewportBound = true
  }

  private _unbindViewport(): void {
    if (isServer) return
    if (this._viewportFrame) {
      cancelAnimationFrame(this._viewportFrame)
      this._viewportFrame = 0
    }
    if (!this._viewportBound) return
    window.removeEventListener('scroll', this._onViewport, true)
    window.removeEventListener('resize', this._onViewport)
    this._viewportBound = false
  }

  /**
   * Coalesced to one frame: `reposition()` writes then reads
   * (`getBoundingClientRect` on anchor and panel) and walks the ancestors with
   * `getComputedStyle`, i.e. it forces a synchronous layout. Running that once per
   * scroll event rather than once per frame is what made scrolling a modal body
   * with an open dropdown stutter.
   */
  private _onViewport = (): void => {
    if (!this.opts.isOpen() || this._viewportFrame) return
    this._viewportFrame = requestAnimationFrame(() => {
      this._viewportFrame = 0
      if (this.opts.isOpen()) this.reposition()
    })
  }

  reposition(): void {
    if (isServer) return
    // Light-DOM hosts only. A shadow host keeps its panel in the shadow root and
    // positions it through its own logic (the controller never adopts it).
    if (!this._canPortal) return

    const panel = this._panel ?? this.opts.getPanel()
    if (!panel) return
    const anchor = this.opts.getAnchor()
    // A detached anchor (a light host's captured slot node before it is re-placed)
    // measures as an all-zero rect, which pinned the panel to the viewport's
    // top-left corner. Skip; the host repositions once the anchor is in the DOM.
    if (!anchor || !anchor.isConnected) return

    // `matchWidth` must land BEFORE the panel is measured — it changes the
    // panel's width, which feeds the align/shift math.
    const matchWidth =
      typeof this.opts.matchWidth === 'function' ? this.opts.matchWidth() : this.opts.matchWidth
    if (matchWidth) {
      panel.style.width = `${anchor.getBoundingClientRect().width}px`
    }

    const constrain = this.opts.constrainSize?.() ?? false
    const placement = computePopupPlacement(anchor, panel, {
      side: this.opts.side?.(),
      align: this.opts.align?.(),
      offset: this.opts.offset?.(),
      flip: this.opts.flip?.(),
      shift: this.opts.shift?.(),
      constrain,
    })
    applyPopupPlacement(panel, placement, constrain)

    if (this._resolvedSide !== placement.side) {
      this._resolvedSide = placement.side
      this.opts.onSideResolved?.(placement.side)
    }
  }
}
