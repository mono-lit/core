/**
 * Modal Component Type Definitions
 */

import type { MonoBreakpoint } from '../../composables/breakpoints'
import type { ButtonProps } from '../button/button-types.js'
import type { MonoEventProps } from '../../composables/element-props.js'

/**
 * Content scale of the modal — header/title font, body font, paddings, close button
 * and corner radius. The same 6-step scale accordion and the form controls use.
 *
 * It does **not** set the panel's width. That is what `width` / `min-width` /
 * `max-width` (and `--mono-modal-width`) are for, so a compact `size="sm"` dialog can
 * still be wide and a roomy `size="xl"` one can still be narrow. Before 2026-08-17
 * `size` was a width preset and did nothing to the type scale.
 */
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

/**
 * Named dimension presets accepted by `width`, `height` and the four `min-*` /
 * `max-*` props.
 *
 * The same six tokens as {@link ModalSize}, on a different axis — `size` scales the
 * CONTENT, these name a MEASURE. Widths are `min(90vw, 300px)` … `min(95vw, 1080px)`
 * (`md` = the modal's default `min(90vw, 520px)`); heights are `22vh` … `95vh`
 * (`md` = `50vh`), matching the drawer's ladder.
 */
export type ModalDimensionPreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

/**
 * A sizing-prop value: a {@link ModalDimensionPreset} token, any CSS length string,
 * or a number / numeric string read as px.
 *
 * The `string & {}` arm keeps the token list in editor autocomplete without
 * narrowing the type — `"32rem"` is still perfectly valid.
 */
export type ModalDimension = ModalDimensionPreset | (string & {}) | number

export type ModalColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'teal'
  | 'purple'
  | 'neutral'
  | 'dark'

export type ModalSource = 'overlay' | 'close' | 'escape' | 'manual'

export interface ModalCssClass {
  root?: string
  overlay?: string
  panel?: string
  head?: string
  /** The heading column inside the head (title + subtitle, or `slot="header"`). */
  heading?: string
  title?: string
  subtitle?: string
  close?: string
  body?: string
  foot?: string
}

/** Shared detail for modal `toggle` / `open` / `close` events. */
export type ModalCloseEventDetail = {
  modelValue: boolean
  currentValue: boolean
  oldValue: boolean
  value: boolean
  source: ModalSource
  sourceEvent?: Event
}

/** Alias — the same detail is carried by every modal state-change event. */
export type ModalChangeEventDetail = ModalCloseEventDetail

/** Fired on every state change. */
export type ModalClickEvent = CustomEvent<ModalChangeEventDetail>
/** Fired on the false → true transition only. */
export type ModalOpenEvent = CustomEvent<ModalChangeEventDetail>
/** Fired on the true → false transition only. */
export type ModalCloseEvent = CustomEvent<ModalCloseEventDetail>

export interface ModalProps {
  /** Open state, two-way bound for v-model-style usage. */
  modelValue?: boolean
  'model-value'?: boolean
  modelvalue?: boolean

  /** Width preset of the modal panel. */
  size?: ModalSize
  /** Theme color applied to accents. */
  color?: ModalColor

  /** Heading text shown in the modal header. `slot="title"` replaces it. */
  title?: string
  /**
   * Secondary line under the title — muted and smaller, hidden when empty.
   * `slot="subtitle"` replaces it; `slot="header"` replaces title + subtitle
   * together (the close ✕ stays).
   */
  subtitle?: string

  /** Shows the close button and allows dismissal. */
  dismissible?: boolean
  /** Prevents closing via overlay click or escape. */
  persistent?: boolean
  /** Renders a backdrop overlay behind the panel. */
  overlay?: boolean
  /** Closes the modal when the Escape key is pressed. */
  closeOnEscape?: boolean
  'close-on-escape'?: boolean
  closeonescape?: boolean
  /** Closes the modal on a click outside the panel: the overlay, or — with `overlay: false` — the page itself (the click still reaches the page). */
  closeOnOverlay?: boolean
  'close-on-overlay'?: boolean
  closeonoverlay?: boolean
  /** Locks body scroll while the modal is open. */
  lockScroll?: boolean
  'lock-scroll'?: boolean
  lockscroll?: boolean

  /** Allow dragging the modal by its header; it snaps back inside the viewport on drop. */
  draggable?: boolean

  /**
   * Fill the screen at a breakpoint and below (default `false`). `auto-fullscreen`
   * on its own means Tailwind's `sm` (< 640px); a token moves the boundary, so
   * `auto-fullscreen="lg"` covers everything `lg:` does not match (< 1024px).
   */
  autoFullscreen?: boolean | MonoBreakpoint
  'auto-fullscreen'?: boolean | MonoBreakpoint
  autofullscreen?: boolean | MonoBreakpoint

  /**
   * Allow this modal to stack on top of others. When false (default) it is
   * exclusive — opening it closes any other open modals.
   */
  stackable?: boolean

  /**
   * Explicit panel sizing. Each accepts a preset token (`"xs"`…`"xxl"` — see
   * {@link ModalDimensionPreset}), a CSS length string (`"12px"`, `"12rem"`,
   * `"80%"`), or a number / numeric string (interpreted as px).
   * Set both `width` and `height` to `"100%"` for true full-screen.
   */
  width?: ModalDimension
  height?: ModalDimension
  minWidth?: ModalDimension
  'min-width'?: ModalDimension
  minwidth?: ModalDimension
  maxWidth?: ModalDimension
  'max-width'?: ModalDimension
  maxwidth?: ModalDimension
  minHeight?: ModalDimension
  'min-height'?: ModalDimension
  minheight?: ModalDimension
  maxHeight?: ModalDimension
  'max-height'?: ModalDimension
  maxheight?: ModalDimension

  /**
   * Pin the modal to an explicit stacking level. Unset (the default) lets the
   * shared popup stack assign one so the newest layer is always on top. The value
   * is the overlay's `z-index`; the panel sits one above it.
   */
  zIndex?: number | string
  'z-index'?: number | string
  zindex?: number | string

  /** Per-part class overrides for internal elements. */
  cssClass?: ModalCssClass
  cssclass?: ModalCssClass
  'css-class'?: ModalCssClass | string
  /** Plain root class string applied to the modal. */
  cssClassName?: string

  /**
   * The controller (`monoModal()` / `controlMonoModal()`) driving this modal. Bind
   * with `.prop`: `:control-modal.prop="modal"`. `dataModal` is the same field.
   */
  controlModal?: MonoModalController
  'control-modal'?: MonoModalController
  controlmodal?: MonoModalController
  dataModal?: MonoModalController
  'data-modal'?: MonoModalController
  datamodal?: MonoModalController
}

export interface ModalEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  toggle: ModalClickEvent
  open: ModalOpenEvent
  close: ModalCloseEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-click': ModalClickEvent
  mnoClick: ModalClickEvent
  'mno-open': ModalOpenEvent
  mnoOpen: ModalOpenEvent
  'mno-close': ModalCloseEvent
  mnoClose: ModalCloseEvent
}

/* ──────────────────────────────────────────────────────────────────────────
 * Controller (`monoModal` / `controlMonoModal`)
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * One action of a programmatic dialog: every `<mono-button>` prop plus the
 * dialog wiring. `handler` is deliberately NOT accepted — `onClick` is the one
 * hook, and it already owns the spinner (see below).
 */
export interface MonoDialogButton extends Omit<ButtonProps, 'handler'> {
  /** Button text (the button's default slot). */
  label?: string
  /** Iconify class for the leading icon, e.g. `i-mdi-check`. */
  icon?: string
  /** Extra class on the button element. */
  className?: string
  /**
   * The answer this button gives: once `onClick` settles, the dialog closes and
   * `show()` resolves with this value — for when the code AFTER `await show()`
   * decides what happens. Without it the button leaves the dialog open unless
   * `onClick` closes it itself (a "see details" link, say).
   */
  value?: unknown
  /**
   * The button's work, run on the click. `ctx.dialog` is the dialog controller;
   * a button that does its own work ends with a bare `dialog.close()` — it
   * already knows it was pressed, so there is nothing to report. Returning a
   * promise keeps the button's spinner on (and defers the `value` close) until
   * it settles; a rejection keeps the dialog open.
   */
  onClick?: (event: MouseEvent, ctx: MonoDialogButtonCtx) => unknown | Promise<unknown>
}

/** Handed to a dialog button's `onClick`, after the click event. */
export interface MonoDialogButtonCtx {
  /**
   * The dialog — `close(value?)`, `isOpen`, `element`, `setProps`. The same
   * object as `modal.dialog`.
   */
  dialog: MonoDialogController
  /** The `<mono-button>` that was pressed. */
  button: HTMLElement
}

/**
 * The programmatic dialog: a compact `<mono-modal>` the controller builds by code
 * on every `show()`. It is a QUESTION — the user must answer it — so it cannot be
 * dismissed: no ✕, no overlay click, no Escape. The only way out is a button
 * that answers — through its `value`, or `dialog.close()` from its `onClick` —
 * or `dialog.close()` from code.
 */
export interface MonoDialogOptions {
  /** Header text. No header at all when omitted (together with `subtitle`). */
  title?: string
  /** Secondary line under the title, muted and smaller. */
  subtitle?: string
  /** The question. A string is rendered as HTML; a Node is appended as-is. */
  body?: string | Node
  /** The actions, centred under the body. */
  buttons?: MonoDialogButton[]
  /** Which button gets focus once open (index), or `'none'`. Default `0`. */
  focus?: number | 'none'
  /**
   * Overrides for the dialog's own `<mono-modal>` — `color`, `size`, `width`,
   * `zIndex`, `cssClass`… — merged over the compact defaults. The dismissal
   * locks (`persistent`, `dismissible: false`, `closeOnEscape: false`) are applied
   * AFTER this and cannot be overridden. Takes the modal's events as `on<Event>`
   * keys too (`onOpen`, `onClose`, …).
   */
  props?: Partial<ModalProps> & MonoEventProps<ModalEvents>
}

export interface MonoDialogController {
  /**
   * Build, open and await the dialog. `override` is merged over the options the
   * controller was created with, for this show only. Resolves with the value the
   * answering button supplied — its `value`, or what its `onClick` passed to
   * `dialog.close(value)` — `false` when `close()` is called bare, and `false`
   * when a second `show()` pre-empts it.
   */
  show<T = boolean>(override?: Partial<MonoDialogOptions>): Promise<T>
  /** Close the open dialog, resolving its `show()` with `value` (default `false`). */
  close(value?: unknown): void
  /** Whether a dialog is currently open. */
  readonly isOpen: boolean
  /** The open dialog's `<mono-modal>` element, or `null`. */
  readonly element: HTMLElement | null
  /** Merge new defaults for future `show()`s. */
  setProps(patch: Partial<MonoDialogOptions>): void
}

export interface MonoModalOptions {
  /**
   * Props pushed onto every `<mono-modal>` bound with `:control-modal.prop`. They
   * WIN over the same attribute written on the element (matching `monoForm`'s
   * `setProp`). The modal's events are accepted as `on<Event>` keys — `onOpen`,
   * `onClose`, `onToggle`, … — and attached to every bound element as listeners.
   */
  props?: Partial<ModalProps> & MonoEventProps<ModalEvents>
  /** Defaults for the programmatic dialog — see {@link MonoDialogOptions}. */
  dialog?: MonoDialogOptions
}

/**
 * What `monoModal()` / `controlMonoModal()` returns.
 *
 * Two independent halves: the bound-modal half (`open` / `close` / `setProps`)
 * drives the `<mono-modal>` elements bound to it and never touches the dialog;
 * the `dialog` half builds its own element per `show()` and never touches the
 * bound ones.
 */
export interface MonoModalController {
  /** The stable props object every bound element pulls on notify. */
  props(): Partial<ModalProps>
  /** Merge into `props()` and notify the bound elements. */
  setProps(patch: Partial<ModalProps>): void
  /** Open the bound modal(s) — `show('manual')`, so `open` fires. */
  open(): void
  /** Close the bound modal(s) — `hide('manual')`, so `close` fires. */
  close(): void
  toggle(): void
  /** Open state of the bound modal; follows user-driven closes (✕, overlay, Escape) too. */
  readonly isOpen: boolean
  /** The first bound `<mono-modal>`, or `null`. */
  readonly element: HTMLElement | null
  /** The programmatic dialog. */
  readonly dialog: MonoDialogController
  /** Called after every state or props change. Returns an unsubscribe. */
  subscribe(cb: () => void): () => void
  /** Closes an open dialog (resolving `false`), drops subscribers and bindings. */
  dispose(): void
  /** @internal element plumbing */
  _register(el: MonoModalElementLike): void
  /** @internal */
  _unregister(el: MonoModalElementLike): void
  /** @internal the element reports its own open/close transitions */
  _report(open: boolean, source: ModalSource): void
}

/** The slice of a `<mono-modal>` the controller drives. */
export interface MonoModalElementLike {
  modelValue: boolean
  show(source?: ModalSource, sourceEvent?: Event): void
  hide(source?: ModalSource, sourceEvent?: Event): void
}
