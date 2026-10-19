//#region src/composables/field-bubble.d.ts
export interface FieldBubbleOptions {
  /** Preferred side of the anchor; flips when it doesn't fit. Default `top`. */
  side?: 'top' | 'bottom';
  /** `center` on the anchor (tooltip), or `start` = flush with its left edge (a message under a box). */
  align?: 'center' | 'start';
}
export declare class FieldBubble {
  /** For `id` / `aria-describedby`. */
  readonly id: string;
  private _anchor;
  private _bubble;
  private _open;
  private _hideTimer;
  private readonly _side;
  private readonly _align;
  constructor(options?: FieldBubbleOptions);
  get isOpen(): boolean;
  /** `ref` callback for the element the bubble points at. */
  setAnchor: (el: Element | undefined | null) => void;
  /** `ref` callback for the bubble itself — a new node closes the old one. */
  setBubble: (el: Element | undefined) => void;
  show: () => void;
  hide: () => void;
  scheduleHide: () => void;
  cancelHide: () => void;
  /** `pointerleave` handler: a touch "leaves" on lift — that would close what the tap just opened. */
  onPointerLeave: (e: PointerEvent) => void;
  /** `keydown` handler: Escape closes. */
  onKeydown: (e: KeyboardEvent) => void;
  /** Fixed-position the bubble on its side of the anchor (the other if it doesn't fit), clamped to the viewport. */
  place: () => void;
}
//#endregion