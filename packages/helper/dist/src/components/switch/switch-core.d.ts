import { LitElement, nothing, TemplateResult } from 'lit';
import { SwitchSize, SwitchColor, SwitchCssClass } from './switch-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoSwitchCoreInterface {
    size: SwitchSize;
    color: SwitchColor;
    modelValue: boolean;
    checked: boolean;
    disabled: boolean;
    loading: boolean;
    label: string;
    /** Secondary line under the label. */
    sublabel: string;
    /** The same as `sublabel`, kept for existing code. */
    description: string;
    value: string;
    name: string;
    ariaLabelText?: string;
    cssClass: SwitchCssClass;
    cssClassName: string;
    focus(): void;
    blur(): void;
    protected _hasLabelSlotState: boolean;
    protected _hasDescriptionSlotState: boolean;
    protected _toBoolean(value: unknown): boolean;
    protected _setCssClass(value: unknown): void;
    protected _cls(base: string, key: keyof SwitchCssClass): string;
    protected get _wrapperClasses(): string;
    protected get _trackClasses(): string;
    protected get _thumbClasses(): string;
    protected _hasLabelContent(): boolean;
    protected _hasDescriptionContent(): boolean;
    protected _handleChange(event: Event): void;
    protected _renderLabelBlock(): TemplateResult | typeof nothing;
}
/**
 * `MonoSwitchCore` — all render-mode-agnostic logic for `mono-switch`: reactive
 * props (incl. SSR boolean coercion), hybrid aliases, camelCase attribute
 * fallbacks, the `modelValue`↔`checked` sync, class computation, change
 * interactivity (`mno-change`), `focus`/`blur`, AND the shared `render()`
 * skeleton (`<label><input role=switch><track><thumb></track><labelBlock></label>`).
 * The slot-bearing label/description region is an overridable hook
 * (`_renderLabelBlock()`) that defaults to the light build's `[data-mono-slot]`
 * placeholders; the shadow build overrides it with native `<slot>` (mirrors
 * `mono-checkbox`). SSR-safe: no `document`/`window`; `focus`/`blur` query
 * `this.renderRoot`.
 */
export declare const MonoSwitchCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoSwitchCoreInterface> & T;
