import { LitElement, TemplateResult } from 'lit';
import { FilterIconName } from './filter-builder-core.js';
declare const MonoFilterBuilderShadow_base: import('../../composables/hybird-prop').Constructor<import('./filter-builder-core.js').MonoFilterBuilderCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-filter-builder` (SSR build, `@mono-lit/helper/ui/shadow/filter`).
 * Registers the DISTINCT `mono-shadow-filter-builder` tag; the light element
 * coexists.
 *
 * `filter.css` alone is enough: this component styles its own controls rather than
 * borrowing `input.css`'s inner classes, so there is no second sheet to adopt.
 */
export declare class MonoFilterBuilderShadow extends MonoFilterBuilderShadow_base {
    static styles: import('lit').CSSResult[];
    protected renderIcon(name: FilterIconName): TemplateResult;
    connectedCallback(): void;
}
export {};
