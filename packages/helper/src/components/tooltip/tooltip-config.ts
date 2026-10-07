// Tooltip addon — app-wide options store + the option merge.
//
// PRECEDENCE: defaults ← per-call (`controlMonoTooltip(t, opts)`) ← GLOBAL
//             ← the anchor's own `mono-tooltip-*` attributes.
// The global layer beats a call on purpose: it is the app's design decision
// ("every tooltip opens after 300ms, below its anchor") and a one-off call must
// not be able to drift from it. An attribute written ON the element is the one
// exception — it is the most specific statement there is, and without it
// `mono-tooltip-placement="left"` would be dead the moment a global placement
// exists. A key a layer leaves `undefined` falls through to the one below.
//
// Resolved on every show rather than cached, so `createMonoTooltip` after
// controllers already exist (a Nuxt plugin running after a component's setup)
// still applies to them.
//
// `createMonoTooltip` itself lives in `tooltip-declarative.ts` — it also switches
// on the attribute tooltips, which needs the controller, and the controller needs
// this file.
import type { MonoTooltipGlobalOptions, MonoTooltipOptions } from './tooltip-types'

export const DEFAULT_TOOLTIP_OPTIONS = {
  allowHTML: false,
  placement: 'top',
  offset: 6,
  padding: 8,
  flip: true,
  shift: true,
  arrow: true,
  trigger: ['hover', 'focus'],
  delay: [100, 0],
  interactive: false,
  // no `maxWidth` here: the CSS default (`--mono-tooltip-max-width`, 20rem)
  // applies unless an option is actually given, so a stylesheet override is not
  // shadowed by an inline default
  variant: 'inverted',
  size: 'md',
  disabled: false,
  hideOnClick: true,
} satisfies MonoTooltipOptions

export type ResolvedTooltipOptions = MonoTooltipOptions & typeof DEFAULT_TOOLTIP_OPTIONS

let globalOptions: MonoTooltipGlobalOptions | null = null

/** @internal — written by `createMonoTooltip` / `resetMonoTooltip`. */
export function setMonoTooltipGlobal(options: MonoTooltipGlobalOptions | null): void {
  globalOptions = options ? { ...options } : null
}

/** The current global options, or `null` when none were set. */
export function getMonoTooltipGlobal(): Readonly<MonoTooltipGlobalOptions> | null {
  return globalOptions
}

/** Keys of the global object that configure the addon, not a tooltip. */
const NOT_TOOLTIP_OPTIONS = new Set(['attributes'])

/**
 * `DEFAULTS ← local ← global ← anchor`, key by key; `undefined` never
 * overwrites. `anchor` is the options read off the element's own attributes.
 */
export function resolveTooltipOptions(
  local?: MonoTooltipOptions | null,
  anchor?: MonoTooltipOptions | null,
): ResolvedTooltipOptions {
  const out: Record<string, unknown> = { ...DEFAULT_TOOLTIP_OPTIONS }
  for (const layer of [local, globalOptions, anchor]) {
    if (!layer) continue
    for (const [key, value] of Object.entries(layer)) {
      if (value !== undefined && !NOT_TOOLTIP_OPTIONS.has(key)) out[key] = value
    }
  }
  return out as unknown as ResolvedTooltipOptions
}
