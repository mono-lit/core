import { Constructor } from "../../composables/hybird-prop.js";
import { CssSizeValue } from "../../composables/css-size.js";
import { MonoTableControllerCoreInterface } from "./table-controller-core.js";
import { InputColor, InputCssClass, InputSize, InputValidationState, InputVariant } from "../input/input-types.js";
import { MonoSearchValue } from "../../search/data-search.js";
import { MonoFormController } from "../form/form-types.js";
import { MonoSuggestionFilter } from "./filter-suggestion.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/table/mono-table-search-core.d.ts
/** Per-build icon hooks the search core delegates to. */
export type TableSearchIconName = 'search' | 'close' | 'chevron';
/** Public surface added by the search core mixin. */
export declare class MonoTableSearchCoreInterface extends MonoTableControllerCoreInterface {
  /** Fields a term matches — replaces `monoDataGrid({ searchExpr })`. */
  searchValue: MonoSearchValue;
  /** Alias of {@link searchValue}, under the grid option's older name. */
  searchExpr: MonoSearchValue;
  /** Passing it (even `''`) switches the box to MANUAL mode — see the class docs. */
  modelValue?: string | null;
  /** The filter form (`controlMonoForm`) a {@link suggestionFilter} reads and relaxes. */
  dataForm?: MonoFormController;
  /** Alias of {@link dataForm}. */
  controlForm?: MonoFormController;
  /** Map row fields onto form keys to offer "N rows under a different filter". */
  suggestionFilter?: MonoSuggestionFilter | null;
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
 * meaning for a filter), and `value`.
 *
 * **Two modes, picked by `modelValue`:**
 * - *grid* (no `model-value`) — the debounce below plus the controller own the
 *   search term, exactly as before;
 * - *manual* (`model-value` passed, even `''`) — a controlled field: it emits
 *   `mono-input`'s `input` / `change` / `clear` (same detail shape) immediately and
 *   NEVER touches the grid's search (`search-value`, `suggestion` and
 *   `multi-context` go inert). The consumer runs the search itself.
 *
 * `input` / `change` / `clear` fire in grid mode too, so a listener works either way.
 *
 * The magnifier and clear glyphs are delegated to `renderIcon()` (light: UnoCSS
 * `.mono-icon i-mdi-*`; shadow: inline SVG) so the chrome is otherwise identical.
 */
export declare const MonoTableSearchCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableSearchCoreInterface> & T;
//#endregion