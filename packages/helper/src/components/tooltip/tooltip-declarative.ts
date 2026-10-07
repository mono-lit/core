// Tooltip addon — `createMonoTooltip` and the declarative attributes it turns on.
//
//   <button mono-tooltip-content="Save changes">Save</button>
//   <mono-button mono-tooltip-content="Save" mono-tooltip-placement="bottom">…</mono-button>
//   <mono-shadow-button :mono-tooltip-content="msg">…</mono-shadow-button>
//
// No per-component `controlMonoTooltip` call: `createMonoTooltip()` (main.ts, or
// Nuxt's `mono.helper.tooltip`) registers ONE controller whose target is the
// attribute selector. Because matching runs on each event's composed path, that
// single controller covers plain HTML, light `<mono-*>` hosts and shadow
// `<mono-shadow-*>` hosts, including elements that mount long after the call.
import { createTooltipController, destroyAllTooltipControllers, hasLiveDocument } from './control-tooltip'
import { setMonoTooltipGlobal } from './tooltip-config'
import type {
  MonoTooltipController,
  MonoTooltipGlobal,
  MonoTooltipGlobalOptions,
  MonoTooltipOptions,
  MonoTooltipTrigger,
} from './tooltip-types'

/** The two text attributes — `message` is an alias of `content`. */
export const TOOLTIP_ATTRIBUTE_SELECTOR = '[mono-tooltip-content], [mono-tooltip-message]'

let declarative: MonoTooltipController | null = null

/**
 * Per-element options, from `mono-tooltip-<option>` attributes:
 *
 * | attribute | option |
 * | --- | --- |
 * | `mono-tooltip-content` / `-message` | `content` (text) |
 * | `mono-tooltip-placement` / `-variant` / `-color` / `-size` | same name |
 * | `mono-tooltip-trigger` | `"hover focus"`, `"click"`, … |
 * | `mono-tooltip-delay` | `"300"` or `"300 100"` |
 * | `mono-tooltip-offset` / `-padding` | numbers |
 * | `mono-tooltip-max-width` / `-class` | strings |
 * | `mono-tooltip-arrow` / `-flip` / `-shift` / `-interactive` / `-html` / `-disabled` / `-hide-on-click` | booleans — present = on, `"false"` = off |
 */
export function readTooltipAttributes(el: Element): MonoTooltipOptions {
  const get = (name: string) => el.getAttribute(`mono-tooltip-${name}`)
  const str = (name: string) => get(name)?.trim() || undefined
  const bool = (name: string) => {
    const v = get(name)
    return v === null ? undefined : v.trim() !== 'false'
  }
  const num = (name: string) => {
    const v = str(name)
    const n = v === undefined ? NaN : Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  const list = (name: string) => str(name)?.split(/[\s,]+/).filter(Boolean)

  // `content` is read raw: an EMPTY attribute means "nothing to show", which is
  // how a bound `:mono-tooltip-content="''"` switches one element off.
  const content = get('content') ?? get('message') ?? undefined
  const delay = list('delay')?.map(Number).filter(Number.isFinite)

  return {
    content,
    placement: str('placement') as MonoTooltipOptions['placement'],
    variant: str('variant') as MonoTooltipOptions['variant'],
    color: str('color') as MonoTooltipOptions['color'],
    size: str('size') as MonoTooltipOptions['size'],
    trigger: list('trigger') as MonoTooltipTrigger[] | undefined,
    delay: delay?.length ? (delay.length > 1 ? [delay[0], delay[1]] : delay[0]) : undefined,
    offset: num('offset'),
    padding: num('padding'),
    maxWidth: str('max-width'),
    class: str('class'),
    arrow: bool('arrow'),
    flip: bool('flip'),
    shift: bool('shift'),
    interactive: bool('interactive'),
    allowHTML: bool('html'),
    disabled: bool('disabled'),
    hideOnClick: bool('hide-on-click'),
  }
}

/**
 * Set the app-wide tooltip options AND switch on the `mono-tooltip-*` attributes.
 * Call once — usually in `main.ts`:
 *
 * ```ts
 * app.use(createMonoTooltip({ delay: [300, 0] }))
 * // or simply
 * createMonoTooltip()
 * ```
 *
 * The options WIN over the ones passed to `controlMonoTooltip`; an element's own
 * `mono-tooltip-*` attributes win over them. A later call replaces the previous
 * global options wholesale. `attributes: false` keeps the options but turns the
 * declarative attributes off.
 */
export function createMonoTooltip(options: MonoTooltipGlobalOptions = {}): MonoTooltipGlobal {
  setMonoTooltipGlobal(options)
  const wantAttributes = options.attributes !== false

  if (wantAttributes && !declarative && hasLiveDocument()) {
    declarative = createTooltipController(TOOLTIP_ATTRIBUTE_SELECTOR, {}, readTooltipAttributes)
  } else if (!wantAttributes && declarative) {
    declarative.destroy()
    declarative = null
  }

  return {
    options: { ...options },
    install() {
      /* the call already applied them; `app.use` is only a convenience */
    },
  }
}

/**
 * Close and forget every live tooltip controller — the attribute one included
 * (a later `createMonoTooltip()` turns the attributes back on). For tests and a
 * full app teardown; the global options are kept.
 */
export function destroyAllMonoTooltips(): void {
  destroyAllTooltipControllers()
  declarative = null
}

/** Drop the global options and turn the attributes off (tests, runtime reconfiguration). */
export function resetMonoTooltip(): void {
  setMonoTooltipGlobal(null)
  declarative?.destroy()
  declarative = null
}
