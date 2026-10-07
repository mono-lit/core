import { LitElement, TemplateResult } from 'lit';
import { PopupPortalController } from '../../composables/popup-portal.js';
import { DropdownPlacement } from '../dropdown/dropdown-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { CssSizeValue } from '../../composables/css-size';
import { MonoDropdownController } from './mono-data-dropdown.js';
import { DropdownTableSize, DropdownTableColor, DropdownTableVariant, DropdownTableValidationState, DropdownPanelOptions, DropdownTableCssClass, DropdownTableChipProps } from './dropdown-table-types.js';
/** Public surface added by the dropdown-table core mixin. */
export declare class MonoDropdownTableCoreInterface {
    dataDropdown?: MonoDropdownController;
    size: DropdownTableSize;
    color: DropdownTableColor;
    variant: DropdownTableVariant;
    label: string;
    placeholder: string;
    helperText: string;
    validationState: DropdownTableValidationState;
    validationMessage: string;
    errorMessage: string;
    successMessage: string;
    required: boolean;
    disabled: boolean;
    readonly: boolean;
    clearable: boolean;
    multiple: boolean;
    max?: number;
    min?: number;
    maxVisible?: number;
    minVisible?: number;
    chip: DropdownTableChipProps;
    modelValue: unknown;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    dropdown?: DropdownPanelOptions;
    placement: DropdownPlacement;
    flip: boolean;
    shift: boolean;
    offset: number;
    cssClass: DropdownTableCssClass;
    cssClassName: string;
    stayOpen: boolean;
    /** The popup controller — the light build reads `panelRoot` for slot placement. */
    protected _popup: PopupPortalController;
    /** Render a panel region — light: a `data-mono-slot` capture target; shadow: native `<slot>`. */
    protected _renderRegion(cls: string, name: string): TemplateResult;
    readonly isOpen: boolean;
    open(): void;
    close(): void;
    toggle(): void;
}
/**
 * `MonoDropdownTableCore` — the field + popup shell for `<mono-dropdown-table>`. The
 * FIELD mirrors `<mono-select>` (same size/color/variant/validation/label props and
 * an identical look); the selection/value/display magic lives in the bound
 * {@link MonoDropdownController} (`monoDataDropdown`). The consumer's native `<table>`
 * + `mono-table-*` are slotted into the body-portaled panel; row clicks delegate to
 * `dd.toggleRow`. The panel is sized independently of the field via the `dropdown`
 * object (`matchWidth` is intentionally off). Reuses `PopupPortalController`,
 * `buildSizeStyle`, and the global `.mono-chip` classes.
 */
export declare const MonoDropdownTableCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoDropdownTableCoreInterface> & T;
