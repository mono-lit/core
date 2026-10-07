// @unocss-include

import { LitElement, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoDrawerCore } from './drawer-core.js'
import {
  guardHostTextContent,
  parkDetachedNodes,
  placeSlotNode,
} from '../../composables/light-slots'

import drawerCss from './drawer.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-drawer` (the default build).
 *
 * Renders into a `<div data-mono-drawer-portal>` appended to `<body>` — the only
 * reliable way to escape transformed / filtered ancestors that would otherwise
 * hijack the containing block of the `position: fixed` overlay + panel. The
 * portal div IS the `.mono-drawer` root, so the shared markup from
 * `MonoDrawerCore._renderDrawerBody()` is rendered straight into it; state
 * classes + `--drawer-z`/resize size-vars are applied imperatively to the portal,
 * and the header/title/subtitle/body/footer slots are captured from light-DOM children and
 * re-parented into `[data-mono-slot]` placeholders. The SSR build lives in
 * `mono-drawer.shadow.ts`; all logic is shared via `MonoDrawerCore`.
 */
@customElement('mono-drawer')
export class MonoDrawer extends MonoDrawerCore(LitElement) {
  static override styles = [unsafeCSS(drawerCss)]

  private _portal: HTMLDivElement | null = null
  private _appliedPortalClasses = new Set<string>()

  private _slotHeader: Node[] = []
  private _slotTitle: Node[] = []
  private _slotSubtitle: Node[] = []
  private _slotBody: Node[] = []
  private _slotFooter: Node[] = []

  /** Parking for captured title/subtitle nodes a `slot="header"` displaced. */
  private _orphanHolder?: HTMLElement

  protected override createRenderRoot(): HTMLElement {
    if (this._portal) return this._portal

    if (typeof document === 'undefined') {
      // SSR — fall back to lightDOM on the host.
      return this
    }

    const portal = document.createElement('div')
    portal.setAttribute('data-mono-drawer-portal', '')

    // Seed the classes BEFORE the portal enters the document — same retention fix as
    // `mono-modal`, which see for the full explanation and the bisection. The first
    // `class` write on an in-document portal that has never been style-resolved left
    // a drawer that is never opened holding itself, its portal and its whole subtree
    // alive for the life of the page (45 nodes + 3 listeners per mount/unmount cycle).
    const initialClasses = this._computeDrawerClasses()
    portal.className = initialClasses.join(' ')
    this._appliedPortalClasses = new Set(initialClasses)

    this._portal = portal
    document.body.appendChild(portal)
    return portal
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Re-attach the SAME portal on a reconnect (a `v-if` toggle, `<KeepAlive>`, or
    // Vue moving the node). Lit builds the render root once and only once —
    // `renderRoot ??= this.createRenderRoot()` — so `createRenderRoot` is NOT called
    // again here and `renderRoot` still points at the portal we detached below.
    // Without this every later render paints into a div that is no longer in the
    // document and the drawer is invisible forever.
    if (this._portal && !this._portal.isConnected && typeof document !== 'undefined') {
      document.body.appendChild(this._portal)
    }
    this._captureSlots()
    this._updatePortalClasses()
    this._updatePortalAttributes()

    // Render synchronously so the captured content — and the consumer's Vue anchors
    // that travel with it into the portal — is re-placed within this insert rather
    // than a microtask later; otherwise a patch in that window (e.g. a child's
    // `mounted()` flipping a v-if) hits a detached node and crashes Vue. Later
    // updates still run async and re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  override disconnectedCallback(): void {
    // Detach the portal but KEEP the reference: it is this element's render root
    // and Lit will never build another one, so nulling it here left the element
    // rendering into a detached node after any reconnect. It is owned by this
    // element, so holding it costs nothing once the element itself is collected.
    if (this._portal && this._portal.parentNode) {
      this._portal.parentNode.removeChild(this._portal)
    }
    super.disconnectedCallback()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._updatePortalClasses()
    this._updatePortalAttributes()
    this._placeSlot('header', this._slotHeader)
    this._placeSlot('title', this._slotTitle)
    this._placeSlot('subtitle', this._slotSubtitle)
    this._placeSlot('body', this._slotBody)
    this._placeSlot('footer', this._slotFooter)
    // A `slot="header"` suppresses the title/subtitle regions, so their captured
    // nodes have no target. Keep them parented (a detached node crashes the
    // consumer framework's next patch) and invisible.
    this._orphanHolder = parkDetachedNodes(this._orphanHolder, [
      ...this._slotTitle,
      ...this._slotSubtitle,
    ])
  }

  /** Light build: the size-vars live on the portal (the `.mono-drawer` root). */
  protected override _setDrawerSizeVar(name: string, value: string): void {
    this._portal?.style.setProperty(name, value)
  }

  protected override _removeDrawerSizeVar(name: string): void {
    this._portal?.style.removeProperty(name)
  }

  private _updatePortalClasses(): void {
    if (!this._portal) return

    const next = new Set(this._computeDrawerClasses())

    for (const cls of this._appliedPortalClasses) {
      if (!next.has(cls)) this._portal.classList.remove(cls)
    }

    for (const cls of next) {
      if (!this._appliedPortalClasses.has(cls)) this._portal.classList.add(cls)
    }

    this._appliedPortalClasses = next
  }

  private _updatePortalAttributes(): void {
    if (!this._portal) return

    // `_effectiveZ` is the `zIndex` prop when set, else the stack's slot.
    this._portal.style.setProperty('--mono-drawer-z', String(this._effectiveZ))
    // Forward any `--mono-drawer-*` custom properties set inline on the host to the
    // portal (the panel lives in a <body> portal, so host-scoped / wrapper vars
    // don't reach it otherwise) — enables per-instance CSS-var theming.
    // Runs AFTER the line above, so an inline `--mono-drawer-z` still wins: it is the
    // lower-level escape hatch, and that precedence predates the `zIndex` prop.
    for (let i = 0; i < this.style.length; i++) {
      const prop = this.style.item(i)
      if (prop.startsWith('--mono-drawer-')) {
        this._portal.style.setProperty(prop, this.style.getPropertyValue(prop))
      }
    }
    // The Basecoat styling attributes, beside the state classes above.
    this._applyRootAttrs(this._portal)
    this._portal.setAttribute('role', 'dialog')
    // Cancels any inherited native tooltip over the panel (see the `title` prop).
    this._portal.setAttribute('title', '')
    const aria = this._headingAria()
    for (const [attr, value] of [
      ['aria-labelledby', aria.labelledby],
      ['aria-describedby', aria.describedby],
    ] as const) {
      if (value) this._portal.setAttribute(attr, value)
      else this._portal.removeAttribute(attr)
    }
    this._portal.setAttribute('aria-modal', this.overlay ? 'true' : 'false')
    this._portal.setAttribute(
      'aria-hidden',
      this.modelValue ? 'false' : 'true',
    )
    if (!this._portal.hasAttribute('tabindex')) {
      this._portal.setAttribute('tabindex', '-1')
    }
  }

  protected override render(): TemplateResult {
    return this._renderDrawerBody()
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return

    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const capturedSlotNodes = new Set<Node>()
    let unslottedSeen = false

    for (const node of captured) {
      if (!(node instanceof Element)) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          this._slotBody.push(node)
          capturedSlotNodes.add(node)
          unslottedSeen = true
        }
        continue
      }

      const slotName = node.getAttribute('slot')

      if (slotName === 'header' || slotName === 'title' || slotName === 'subtitle') {
        node.removeAttribute('slot')
        ;(slotName === 'header'
          ? this._slotHeader
          : slotName === 'title'
            ? this._slotTitle
            : this._slotSubtitle
        ).push(node)
        capturedSlotNodes.add(node)
        continue
      }

      if (slotName === 'footer' || slotName === 'foot') {
        node.removeAttribute('slot')
        this._slotFooter.push(node)
        capturedSlotNodes.add(node)
        continue
      }

      if (slotName === 'body' || slotName === null) {
        if (slotName === 'body') node.removeAttribute('slot')
        this._slotBody.push(node)
        capturedSlotNodes.add(node)
        unslottedSeen = true
        continue
      }
    }

    this._hasHeaderSlotState = this._slotHeader.length > 0
    this._hasTitleSlotState = this._slotTitle.length > 0
    this._hasSubtitleSlotState = this._slotSubtitle.length > 0
    this._hasFooterSlotState = this._slotFooter.length > 0
    this._hasBodySlotState = unslottedSeen && this._slotBody.length > 0

    for (const node of capturedSlotNodes) {
      if (node.parentNode === this) {
        this.removeChild(node)
      }
    }

    // Vue patches a lone interpolation with `host.textContent = next`, which in a
    // light build would wipe this element's whole render. Send those writes to the
    // body region instead.
    guardHostTextContent(
      this,
      new Map([
        ['header', this._slotHeader],
        ['title', this._slotTitle],
        ['subtitle', this._slotSubtitle],
        ['body', this._slotBody],
        ['footer', this._slotFooter],
      ]),
      {
        fallback: 'body',
        onWrite: () => {
          this._hasBodySlotState = this._slotBody.length > 0
          this.requestUpdate()
        },
      },
    )
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length || !this._portal) return

    const target = this._portal.querySelector(`[data-mono-slot="${name}"]`)
    if (!target) return

    for (const node of nodes) {
      placeSlotNode(target, node)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-drawer': MonoDrawer
  }
}
