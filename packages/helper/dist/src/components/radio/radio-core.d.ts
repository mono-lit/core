import { LitElement, nothing, TemplateResult } from 'lit';
import { RadioSize, RadioColor, RadioValue, RadioCssClass } from './radio-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoRadioCoreInterface {
    size: RadioSize;
    color: RadioColor;
    value: RadioValue;
    modelValue: RadioValue;
    disabled: boolean;
    label: string;
    /** Secondary line under the label. */
    sublabel: string;
    /** The same as `sublabel`, kept for existing code. */
    description: string;
    ariaLabelText?: string;
    cssClass: RadioCssClass;
    cssClassName: string;
    focus(): void;
    blur(): void;
    protected _hasLabelSlotState: boolean;
    protected _hasDescriptionSlotState: boolean;
    protected _setCssClass(value: unknown): void;
    protected _toRadioValue(value: unknown): RadioValue;
    protected _cls(base: string, key: keyof RadioCssClass): string;
    protected get _checked(): boolean;
    protected get _wrapperClasses(): string;
    protected _hasLabelContent(): boolean;
    protected _hasDescriptionContent(): boolean;
    protected _handleChange(event: Event): void;
    protected _renderLabelBlock(): TemplateResult | typeof nothing;
}
/**
 * `MonoRadioCore` — all render-mode-agnostic logic for `mono-radio`: reactive
 * props (incl. SSR `disabled` coercion), hybrid aliases (incl. the
 * `ariaLabel`/`aria-label`/`arialabel` → `ariaLabelText` getters), camelCase
 * attribute fallbacks, class computation, the `mno-change` interactivity, and the
 * shared `<label><input><circle><dot></circle><labelBlock></label>` `render()`
 * (the radio dot is pure CSS — no icons). Only the label/description region is a
 * hook (`_renderLabelBlock`) — the light build uses `data-mono-slot`, the shadow
 * build native `<slot>` (mirrors `mono-checkbox`).
 *
 * SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`.
 */
export declare const MonoRadioCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoRadioCoreInterface> & T;
