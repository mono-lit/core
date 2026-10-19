/* =========================================================================
   Field bubble — the small built-in popup a field control shows without any
   dependency: the plain-text label `tooltip`, and the `validation-position`
   icon / float messages.
   -------------------------------------------------------------------------
   The bubble element is rendered by its owner (it carries `[mono-field-bubble]`
   and `popover="manual"`); this class only opens, closes and places it.
   Opening puts it in the top layer (Popover API), so a field's `overflow`, a
   disabled label's `opacity` and stacking contexts can't clip or fade it;
   `mono-open` is set as well and is the fallback where the API is missing.
   Placement is fixed-position JS: on the preferred side of the anchor, the
   other side when it doesn't fit, clamped to the viewport. Scroll / resize
   listeners exist only while it is open. Styled by
   `components/form/field-tooltip.css`.
   ========================================================================= */

/** Gap between anchor and bubble, and the bubble's minimum distance to the viewport edge. */
const GAP = 8
const EDGE = 8
/** Grace period for moving the pointer from the anchor onto the bubble. */
const HIDE_DELAY = 120

let _uid = 0

export interface FieldBubbleOptions {
  /** Preferred side of the anchor; flips when it doesn't fit. Default `top`. */
  side?: 'top' | 'bottom'
  /** `center` on the anchor (tooltip), or `start` = flush with its left edge (a message under a box). */
  align?: 'center' | 'start'
}

export class FieldBubble {
  /** For `id` / `aria-describedby`. */
  readonly id = `mono-field-bubble-${++_uid}`
  private _anchor: HTMLElement | null = null
  private _bubble: HTMLElement | null = null
  private _open = false
  private _hideTimer: ReturnType<typeof setTimeout> | undefined
  private readonly _side: 'top' | 'bottom'
  private readonly _align: 'center' | 'start'

  constructor(options: FieldBubbleOptions = {}) {
    this._side = options.side ?? 'top'
    this._align = options.align ?? 'center'
  }

  get isOpen(): boolean {
    return this._open
  }

  /** `ref` callback for the element the bubble points at. */
  setAnchor = (el: Element | undefined | null): void => {
    this._anchor = (el as HTMLElement | undefined) ?? null
  }

  /** `ref` callback for the bubble itself — a new node closes the old one. */
  setBubble = (el: Element | undefined): void => {
    if ((el ?? null) !== this._bubble) this.hide()
    this._bubble = (el as HTMLElement | undefined) ?? null
  }

  show = (): void => {
    this.cancelHide()
    const bubble = this._bubble
    if (!bubble || !bubble.isConnected || !this._anchor) return
    if (!this._open) {
      this._open = true
      bubble.setAttribute('mono-open', '')
      // Top layer where supported — escapes overflow, opacity and z-index.
      try {
        if (typeof bubble.showPopover === 'function' && !bubble.matches(':popover-open')) bubble.showPopover()
      } catch {
        /* not in a document / unsupported — the `mono-open` fallback still shows it */
      }
      window.addEventListener('scroll', this.place, true)
      window.addEventListener('resize', this.place)
    }
    this.place()
  }

  hide = (): void => {
    this.cancelHide()
    if (!this._open) return
    this._open = false
    window.removeEventListener('scroll', this.place, true)
    window.removeEventListener('resize', this.place)
    const bubble = this._bubble
    if (!bubble) return
    bubble.removeAttribute('mono-open')
    try {
      if (typeof bubble.hidePopover === 'function' && bubble.matches(':popover-open')) bubble.hidePopover()
    } catch {
      /* already closed */
    }
  }

  scheduleHide = (): void => {
    this.cancelHide()
    this._hideTimer = setTimeout(this.hide, HIDE_DELAY)
  }

  cancelHide = (): void => {
    if (this._hideTimer !== undefined) clearTimeout(this._hideTimer)
    this._hideTimer = undefined
  }

  /** `pointerleave` handler: a touch "leaves" on lift — that would close what the tap just opened. */
  onPointerLeave = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return
    this.scheduleHide()
  }

  /** `keydown` handler: Escape closes. */
  onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._open) {
      e.stopPropagation()
      this.hide()
    }
  }

  /** Fixed-position the bubble on its side of the anchor (the other if it doesn't fit), clamped to the viewport. */
  place = (): void => {
    const anchor = this._anchor
    const bubble = this._bubble
    if (!this._open || !anchor || !bubble) return
    const r = anchor.getBoundingClientRect()
    const vw = document.documentElement.clientWidth || window.innerWidth
    const vh = window.innerHeight
    const bw = bubble.offsetWidth
    const bh = bubble.offsetHeight
    const above = r.top - GAP - bh
    const below = r.bottom + GAP
    const fitsAbove = above >= EDGE
    const fitsBelow = below + bh <= vh - EDGE
    const side = this._side === 'top'
      ? (fitsAbove || !fitsBelow ? 'top' : 'bottom')
      : (fitsBelow || !fitsAbove ? 'bottom' : 'top')
    const top = side === 'top' ? above : below
    // The arrow points at the anchor's centre (tooltip) or near its start edge (message).
    const target = this._align === 'center' ? r.left + r.width / 2 : r.left + Math.min(16, r.width / 2)
    const ideal = this._align === 'center' ? target - bw / 2 : r.left
    const left = Math.min(Math.max(ideal, EDGE), Math.max(EDGE, vw - EDGE - bw))
    bubble.style.top = `${Math.round(top)}px`
    bubble.style.left = `${Math.round(left)}px`
    bubble.style.setProperty('--_mono-field-tip-arrow-x', `${Math.round(target - left)}px`)
    bubble.setAttribute('mono-side', side)
  }
}
