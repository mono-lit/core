import { LitElement, nothing, TemplateResult } from 'lit';
import { CheckboxSize, CheckboxColor, CheckboxCssClass } from './checkbox-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoCheckboxCoreInterface {
    size: CheckboxSize;
    color: CheckboxColor;
    modelValue: boolean;
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    loading: boolean;
    label: string;
    /** Secondary line under the label. */
    sublabel: string;
    /** The same as `sublabel`, kept for existing code. */
    description: string;
    value: string;
    name: string;
    ariaLabelText?: string;
    cssClass: CheckboxCssClass;
    cssClassName: string;
    focus(): void;
    blur(): void;
    protected _hasIcon: boolean;
    protected _hasIndeterminateIcon: boolean;
    protected _hasLabelSlotState: boolean;
    protected _hasDescriptionSlotState: boolean;
    protected _toBoolean(value: unknown): boolean;
    protected _cls(base: string, key: keyof CheckboxCssClass): string;
    protected get _wrapperClasses(): string;
    protected get _inputClasses(): string;
    protected get _boxClasses(): string;
    protected _hasLabelContent(): boolean;
    protected _hasDescriptionContent(): boolean;
    protected _handleChange(event: Event): void;
    protected _renderCustomIcon(): TemplateResult | typeof nothing;
    protected _renderLoadingIcon(): TemplateResult;
    protected _renderLabelBlock(): TemplateResult | typeof nothing;
}
/**
 * `MonoCheckboxCore` — all render-mode-agnostic logic for `mono-checkbox`:
 * reactive props (incl. SSR boolean coercion), hybrid aliases, camelCase
 * attribute fallbacks, the `modelValue`↔`checked` sync, class computation,
 * change interactivity (`mno-change`), `focus`/`blur`, AND the shared `render()`
 * skeleton (`<label><input><box></box><labelBlock></label>`). The slot-bearing
 * regions are two overridable hooks — `_renderCustomIcon()` / `_renderLabelBlock()`
 * — that default to the light build's `[data-mono-slot]` placeholders; the shadow
 * build overrides them with native `<slot>` (mirrors `mono-accordion`).
 *
 * SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`.
 */
export declare const MonoCheckboxCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoCheckboxCoreInterface> & T;
