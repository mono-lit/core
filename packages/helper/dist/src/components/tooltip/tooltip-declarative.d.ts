import { MonoTooltipGlobal, MonoTooltipGlobalOptions, MonoTooltipOptions } from './tooltip-types';
/** The two text attributes — `message` is an alias of `content`. */
export declare const TOOLTIP_ATTRIBUTE_SELECTOR = "[mono-tooltip-content], [mono-tooltip-message]";
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
export declare function readTooltipAttributes(el: Element): MonoTooltipOptions;
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
export declare function createMonoTooltip(options?: MonoTooltipGlobalOptions): MonoTooltipGlobal;
/**
 * Close and forget every live tooltip controller — the attribute one included
 * (a later `createMonoTooltip()` turns the attributes back on). For tests and a
 * full app teardown; the global options are kept.
 */
export declare function destroyAllMonoTooltips(): void;
/** Drop the global options and turn the attributes off (tests, runtime reconfiguration). */
export declare function resetMonoTooltip(): void;
