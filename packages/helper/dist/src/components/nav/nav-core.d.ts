import { LitElement, TemplateResult } from 'lit';
import { NavDensity, NavColor, NavVariant, NavCssClass } from './nav-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Slot regions the nav chrome lays out. `default` is the unnamed center slot. */
export type NavSlotName = 'start' | 'default' | 'end' | 'extension';
/**
 * Public surface the core mixin adds. Declared so the mixin's type can be
 * exported and so the light/shadow wrappers (and the tag map) see the API.
 */
export declare class MonoNavCoreInterface {
    density: NavDensity;
    color: NavColor;
    variant: NavVariant;
    sticky: boolean;
    extension: boolean;
    cssClass: NavCssClass;
    cssClassName: string;
    /** Resolved bar height in px, including the extension row when enabled. */
    getHeight(): number;
    /** Per-region slot content hook — overridden by the light/shadow wrappers. */
    protected renderSlot(slotName: NavSlotName): TemplateResult;
}
/**
 * `MonoNavCore` — every render-mode-agnostic concern for `mono-nav`:
 * reactive props, the `css-class`/`cssclass` hybrid aliases, attribute
 * observation, layout-var side effects, and the chrome `render()`.
 *
 * What it deliberately does NOT decide:
 *  - `createRenderRoot()` (light vs shadow) — set by each wrapper.
 *  - how styles apply (global sheet vs `static styles`) — set by each wrapper.
 *  - the slot strategy — `renderSlot()` is a hook each wrapper overrides
 *    (light: empty, nodes are captured/placed; shadow: native `<slot>`).
 */
export declare const MonoNavCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoNavCoreInterface> & T;
