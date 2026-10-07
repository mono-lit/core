import { MonoTooltipGlobalOptions, MonoTooltipOptions } from './tooltip-types';
export declare const DEFAULT_TOOLTIP_OPTIONS: {
    allowHTML: false;
    placement: "top";
    offset: number;
    padding: number;
    flip: true;
    shift: true;
    arrow: true;
    trigger: ("focus" | "hover")[];
    delay: [number, number];
    interactive: false;
    variant: "inverted";
    size: "md";
    disabled: false;
    hideOnClick: true;
};
export type ResolvedTooltipOptions = MonoTooltipOptions & typeof DEFAULT_TOOLTIP_OPTIONS;
/** @internal — written by `createMonoTooltip` / `resetMonoTooltip`. */
export declare function setMonoTooltipGlobal(options: MonoTooltipGlobalOptions | null): void;
/** The current global options, or `null` when none were set. */
export declare function getMonoTooltipGlobal(): Readonly<MonoTooltipGlobalOptions> | null;
/**
 * `DEFAULTS ← local ← global ← anchor`, key by key; `undefined` never
 * overwrites. `anchor` is the options read off the element's own attributes.
 */
export declare function resolveTooltipOptions(local?: MonoTooltipOptions | null, anchor?: MonoTooltipOptions | null): ResolvedTooltipOptions;
