import { LitElement, TemplateResult } from 'lit';
import { MonoFilterController, MonoFilterSize } from './filter-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { CssSizeValue } from '../../composables/css-size';
/** Per-build icon hooks the core delegates to. */
export type FilterIconName = 'nested' | 'trash' | 'plus';
/** Public surface added by the filter-builder core mixin. */
export declare class MonoFilterBuilderCoreInterface extends LitElement {
    dataFilter?: MonoFilterController;
    size: MonoFilterSize;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    protected renderIcon(name: FilterIconName): TemplateResult;
    /** Pull `controlMonoFilterBuilder({ props })` onto this element. */
    protected _applyControllerProps(): void;
}
/**
 * `MonoFilterBuilderCore` — render-mode-agnostic logic for `mono-filter-builder`.
 *
 * Renders the controller's node tree as nested inline rows:
 *
 * ```
 * Match [any ▾] of the following rules:
 *   | field ▾ | operator ▾ | value | ⑃ | 🗑 |
 * ```
 *
 * Per repo convention it renders **native** `<select>` / `<input>` carrying
 * its OWN control classes — no component here embeds another `mono-*`
 * element (`mono-table-search` set that precedent), so the controls match the rest
 * of the library without a cross-element dependency.
 */
export declare const MonoFilterBuilderCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoFilterBuilderCoreInterface> & T;
