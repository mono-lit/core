// Tooltip addon — public types.
//
// `@floating-ui/*` are OPTIONAL peers, so nothing here imports them — not even
// types: the emitted `.d.ts` would then fail `tsc` in an app that never installed
// them. `MonoTooltipPlacement` restates Floating UI's `Placement` union.
import type { MaybeReactive } from '../../composables/reactive'

type Side = 'top' | 'right' | 'bottom' | 'left'
export type MonoTooltipPlacement = Side | `${Side}-start` | `${Side}-end`

/** What opens the tooltip. `manual` = only `show()` / `hide()` do. */
export type MonoTooltipTrigger = 'hover' | 'focus' | 'click' | 'manual'

/** `inverted` = Basecoat's dark-on-light chip (default); `popover` = the dropdown surface. */
export type MonoTooltipVariant = 'inverted' | 'popover'

export type MonoTooltipColor =
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

export type MonoTooltipSize = 'sm' | 'md' | 'lg'

/**
 * The tooltip body. A function is called with the ANCHOR on every show, so one
 * `controlMonoTooltip('.row-action', …)` can say something different per row.
 * Returning `null` / `''` skips the show.
 */
export type MonoTooltipContent =
  | string
  | Node
  | ((anchor: Element) => string | Node | null | undefined)

/** Anything that names the elements to decorate. */
export type MonoTooltipTargetValue =
  | string
  | Element
  | null
  | undefined
  | ArrayLike<Element>
  | Iterable<Element>

/**
 * A CSS selector (`'.save'`, `'#id'`, `'[data-tip]'`, `'mono-button'`), an element,
 * a list of elements, or a Vue `ref` / getter of any of those — re-read on every
 * pointer / focus event, so a ref that is still `null` in `<script setup>` just
 * starts matching once the element mounts.
 */
export type MonoTooltipTarget = MaybeReactive<MonoTooltipTargetValue>

export interface MonoTooltipOptions {
  /**
   * The text (or node) to show. When omitted the anchor supplies it:
   * `mono-tooltip-content` → `mono-tooltip-message` → `title` → `aria-label`.
   */
  content?: MonoTooltipContent
  /** Treat string content as HTML. Default `false` (set as text). */
  allowHTML?: boolean
  /** Preferred side (+ alignment). Default `'top'`. Flipped when there is no room. */
  placement?: MonoTooltipPlacement
  /** Gap between the anchor and the tooltip, px. Default `6`. */
  offset?: number
  /** Viewport padding kept by flip/shift, px. Default `8`. */
  padding?: number
  /** Flip to the opposite side when the preferred one overflows. Default `true`. */
  flip?: boolean
  /** Slide along the anchor to stay inside the viewport. Default `true`. */
  shift?: boolean
  /** Draw the pointer arrow. Default `true`. */
  arrow?: boolean
  /** What opens it. Default `['hover', 'focus']`. */
  trigger?: MonoTooltipTrigger | MonoTooltipTrigger[]
  /** Open / close delay in ms — one number for both, or `[show, hide]`. Default `[100, 0]`. */
  delay?: number | [number, number]
  /** Keep it open while the pointer is over the tooltip itself (links, buttons inside). Default `false`. */
  interactive?: boolean
  /** CSS `max-width` of the bubble. Default: `--mono-tooltip-max-width`, else `20rem`. */
  maxWidth?: string
  variant?: MonoTooltipVariant
  /** Paint the bubble in a palette colour instead of the variant's surface. */
  color?: MonoTooltipColor
  size?: MonoTooltipSize
  /** Extra class(es) on the floating element. */
  class?: string
  /** Where the floating element is appended. Default `document.body`. */
  appendTo?: Element | (() => Element | null)
  /** Stop opening (an open one closes). Default `false`. */
  disabled?: boolean
  /** Close a hover/focus tooltip when its anchor is clicked. Default `true`. */
  hideOnClick?: boolean
  /** Before it opens — return `false` to cancel. */
  onShow?: (anchor: Element, tooltip: HTMLElement) => void | boolean
  /** Before it closes — return `false` to keep it. */
  onHide?: (anchor: Element, tooltip: HTMLElement) => void | boolean
}

/**
 * What `createMonoTooltip` / Nuxt's `mono.helper.tooltip` take: every tooltip
 * option (applied app-wide) plus the addon switches below. The Nuxt config
 * additionally has to be JSON — no functions, no nodes.
 */
export interface MonoTooltipGlobalOptions extends MonoTooltipOptions {
  /**
   * Turn on the declarative attributes — any element (plain HTML, light or
   * shadow `<mono-*>`) with `mono-tooltip-content="…"` (or `mono-tooltip-message`)
   * gets a tooltip, no `controlMonoTooltip` call needed. Default `true`.
   */
  attributes?: boolean
}

/** What `controlMonoTooltip(...)` returns. */
export interface MonoTooltipController {
  /** Open on `anchor` (default: the first element the target currently resolves to). */
  show(anchor?: Element): Promise<void>
  hide(): void
  toggle(anchor?: Element): Promise<void>
  /** Merge into this controller's own options (global options still win). */
  update(options: Partial<MonoTooltipOptions>): void
  /** Replace the content; an open tooltip re-renders in place. */
  setContent(content: MonoTooltipContent | undefined): void
  enable(): void
  disable(): void
  /** True while the tooltip is on screen. */
  readonly isOpen: boolean
  /** The element it is currently open on, else `null`. */
  readonly anchor: Element | null
  /** The floating element while open, else `null`. */
  readonly tooltip: HTMLElement | null
  /** Close it and stop listening. Call from `onBeforeUnmount`. */
  destroy(): void
}

/** What `createMonoTooltip(...)` returns — also a Vue plugin (`app.use(...)`). */
export interface MonoTooltipGlobal {
  readonly options: Readonly<MonoTooltipGlobalOptions>
  /** Vue plugin hook — a no-op; the options are already applied by the call. */
  install(app?: unknown): void
}
