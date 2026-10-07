// @unocss-include

import { LitElement, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoModalCore } from './modal-core.js'
import {
  guardHostTextContent,
  parkDetachedNodes,
  placeSlotNode,
} from '../../composables/light-slots'

import modalCss from './modal.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-modal` (the default build).
 *
 * Renders into a `<div data-mono-modal-portal>` appended to `<body>` (same
 * pattern drawer uses — the only reliable way to escape transformed / filtered
 * ancestors that would otherwise hijack the containing block of a
 * `position: fixed` overlay). The portal div IS the `.mono-modal` root, so the
 * shared markup from `MonoModalCore._renderModalBody()` is rendered straight
 * into it; state classes + `--modal-z` are applied imperatively to the portal,
 * and the head/title/subtitle/body/foot slots are captured from light-DOM children and
 * re-parented into `[data-mono-slot]` placeholders. The SSR build lives in
 * `mono-modal.shadow.ts`; all logic is shared via `MonoModalCore`.
 */
@customElement('mono-modal')
export class MonoModal extends MonoModalCore(LitElement) {
  static override styles = [unsafeCSS(modalCss)]

  private _portal: HTMLDivElement | null = null
  private _appliedPortalClasses = new Set<string>()

  private _slotHead: Node[] = []
  private _slotTitle: Node[] = []
  private _slotSubtitle: Node[] = []
  private _slotBody: Node[] = []
  private _slotFoot: Node[] = []

  /** `slot="header"` / `slot="footer"` — aliases that OUTRANK `head`/`foot`. */
  private _slotHeaderAlias: Node[] = []
  private _slotFooterAlias: Node[] = []

  /** Detached parking for captured nodes that lost the alias contest. */
  private _orphanHolder?: HTMLElement

  protected override createRenderRoot(): HTMLElement {
    if (this._portal) return this._portal

    if (typeof document === 'undefined') {
      // SSR — fall back to lightDOM on the host.
      return this
    }

    const portal = document.createElement('div')
    portal.setAttribute('data-mono-modal-portal', '')

    // Seed the classes BEFORE the portal enters the document, and record them so
    // `_updatePortalClasses()` finds no diff and writes nothing on the first render.
    //
    // This is a memory fix, not a cosmetic one. MEASURED: the first `class` write on
    // a portal that is already in the document but has never been style-resolved left
    // the element, its portal and the whole rendered subtree alive for the life of the
    // page — 51 nodes + 5 listeners + the element itself, per mount/unmount cycle. A
    // `v-if`'d modal the user never opens leaked on every toggle.
    //
    // Bisected precisely: reading `className` is clean, `setAttribute('data-x')` is
    // clean, writing `className = ''` leaks, and writing the same classes while the
    // portal is DETACHED is clean. Opening the modal also releases it, and a class
    // write AFTER the portal has been resolved once (e.g. changing `size` later) is
    // clean too — so it is only ever the first write that matters.
    //
    // The most likely mechanism is a style invalidation registered against a
    // never-resolved element that Blink holds a traced reference to (heap snapshots
    // put the retainer in `(Traced handles) ← (GC roots)`, not in any JS reference).
    // That part is inference; everything above it is measured. Verified with an
    // in-page FinalizationRegistry — 0/30 instances collected before, 29/30 after.
    // See docs/e2e/stress.mjs (repo root).
    const initialClasses = this._computeModalClasses()
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
    // document and the modal is invisible forever.
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
    this._placeSlot('head', this._slotHead)
    this._placeSlot('title', this._slotTitle)
    this._placeSlot('subtitle', this._slotSubtitle)
    this._placeSlot('body', this._slotBody)
    this._placeSlot('foot', this._slotFoot)
    // A `slot="header"` suppresses the title/subtitle regions, so their captured
    // nodes have no target. Keep them parented (a detached node crashes the
    // consumer framework's next patch) and invisible.
    this._orphanHolder = parkDetachedNodes(this._orphanHolder, [
      ...this._slotTitle,
      ...this._slotSubtitle,
    ])
  }

  private _updatePortalClasses(): void {
    if (!this._portal) return

    const next = new Set(this._computeModalClasses())

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
    this._portal.style.setProperty('--mono-modal-z', String(this._effectiveZ))
    // Forward any `--mono-modal-*` custom properties set inline on the host to the
    // portal (the panel lives in a <body> portal, so host-scoped / wrapper vars
    // don't reach it otherwise) — enables per-instance CSS-var theming.
    // Runs AFTER the line above, so an inline `--mono-modal-z` still wins: it is the
    // lower-level escape hatch, and that precedence predates the `zIndex` prop.
    for (let i = 0; i < this.style.length; i++) {
      const prop = this.style.item(i)
      if (prop.startsWith('--mono-modal-')) {
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
    return this._renderModalBody()
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

      // `header`/`footer` are aliases of `head`/`foot` (drawer's vocabulary). They
      // are collected SEPARATELY so the alias can take priority when a consumer
      // supplies both — see the resolve step after this loop.
      if (slotName === 'head' || slotName === 'header') {
        node.removeAttribute('slot')
        ;(slotName === 'header' ? this._slotHeaderAlias : this._slotHead).push(node)
        capturedSlotNodes.add(node)
        continue
      }

      if (slotName === 'title' || slotName === 'subtitle') {
        node.removeAttribute('slot')
        ;(slotName === 'title' ? this._slotTitle : this._slotSubtitle).push(node)
        capturedSlotNodes.add(node)
        continue
      }

      if (slotName === 'foot' || slotName === 'footer') {
        node.removeAttribute('slot')
        ;(slotName === 'footer' ? this._slotFooterAlias : this._slotFoot).push(node)
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

    // Alias wins when both are present. The LOSING nodes were already detached
    // from the host, and a captured node left with `parentNode === null` crashes
    // the consumer framework's next patch — so they are parked in a detached
    // holder rather than dropped (see composables/light-slots).
    if (this._slotHeaderAlias.length) {
      this._orphanHolder = parkDetachedNodes(this._orphanHolder, this._slotHead)
      this._slotHead = this._slotHeaderAlias
    }
    if (this._slotFooterAlias.length) {
      this._orphanHolder = parkDetachedNodes(this._orphanHolder, this._slotFoot)
      this._slotFoot = this._slotFooterAlias
    }

    this._hasHeadSlotState = this._slotHead.length > 0
    this._hasTitleSlotState = this._slotTitle.length > 0
    this._hasSubtitleSlotState = this._slotSubtitle.length > 0
    this._hasFootSlotState = this._slotFoot.length > 0
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
        ['head', this._slotHead],
        ['title', this._slotTitle],
        ['subtitle', this._slotSubtitle],
        ['body', this._slotBody],
        ['foot', this._slotFoot],
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
    'mono-modal': MonoModal
  }
}
