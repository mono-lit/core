import { LitElement, TemplateResult } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { MonoSearchValue } from '../../search/data-search.js';
import { InputCssClass, InputColor, InputSize, InputValidationState, InputVariant } from '../input/input-types.js';
import { CssSizeValue } from '../../composables/css-size';
import { Constructor } from '../../composables/hybird-prop';
/** Per-build icon hooks the search core delegates to. */
export type TableSearchIconName = 'search' | 'close' | 'chevron';
/** Public surface added by the search core mixin. */
export declare class MonoTableSearchCoreInterface extends MonoTableControllerCoreInterface {
    /** Fields a term matches — replaces `monoDataGrid({ searchExpr })`. */
    searchValue: MonoSearchValue;
    /** Alias of {@link searchValue}, under the grid option's older name. */
    searchExpr: MonoSearchValue;
    placeholder: string;
    disabled: boolean;
    debounce: number;
    noIcon: boolean;
    size: InputSize;
    color: InputColor;
    variant: InputVariant;
    readonly: boolean;
    clearable: boolean;
    autofocus: boolean;
    label: string;
    helperText: string;
    validationState: InputValidationState;
    validationMessage: string;
    error: boolean;
    errorMessage: string;
    success: boolean;
    successMessage: string;
    name: string;
    autocomplete: string;
    inputmode: string;
    minLength?: number;
    maxLength?: number;
    ariaLabelText?: string;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    cssClass: InputCssClass;
    cssClassName: string;
    focus(options?: FocusOptions): void;
    blur(): void;
    protected renderIcon(name: TableSearchIconName): TemplateResult;
    protected _renderFilterSlotContent(): TemplateResult;
    protected _onFilterSlotChange(e: Event): void;
    protected _setFilterSlotted(value: boolean): void;
    protected _filterPanelRoot(): ParentNode | null;
}
/**
 * `MonoTableSearchCore` — render-mode-agnostic logic for `mono-table-search`: a
 * debounced search box wired to the controller.
 *
 * It renders **`mono-input`'s markup and class names** (`.mono-input` →
 * `.mono-input-field` → `.mono-input-native`) rather than a bespoke box, so the
 * whole size × color × variant matrix in `input.css` applies verbatim and a
 * search sitting beside a `<mono-input>` in a toolbar matches it exactly. That is
 * also why the prop names, attribute names and converters below mirror
 * `input-core.ts` — markup is portable between the two elements.
 *
 * Deliberately NOT taken from `InputProps`: `type` (pinned to `search`),
 * `required` / `pattern` / `min` / `max` / `step` (form-submit constraints with no
 * meaning for a filter), and `value` / `modelValue` — the debounce below plus the
 * controller own the search term.
 *
 * The magnifier and clear glyphs are delegated to `renderIcon()` (light: UnoCSS
 * `.mono-icon i-mdi-*`; shadow: inline SVG) so the chrome is otherwise identical.
 */
export declare const MonoTableSearchCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableSearchCoreInterface> & T;
