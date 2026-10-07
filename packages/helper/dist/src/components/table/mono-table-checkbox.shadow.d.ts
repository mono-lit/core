import { LitElement, TemplateResult } from 'lit';
declare const MonoTableCheckboxShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-checkbox-core.js').MonoTableCheckboxCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-table-checkbox` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 *
 * The element renders `mono-checkbox`'s classes, and a shadow root can't see the
 * page stylesheet, so `checkbox.css` is adopted alongside `table.css` — checkbox
 * first so table rules can still override. `checkbox.css`'s bare
 * `mono-checkbox { }` selector simply never matches in here, which is harmless.
 * (Same arrangement `mono-table-search.shadow` uses for `input.css`.)
 *
 * The selection is client-only, so SSR emits an unchecked shell. All logic is
 * shared via `MonoTableCheckboxCore`.
 */
export declare class MonoTableCheckboxShadow extends MonoTableCheckboxShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    /**
     * `mdi:loading` inlined — a shadow root can't reach the page's `i-mdi-*`
     * utility CSS, so the light build's icon class would render nothing here.
     * `fill="currentColor"` keeps it on the box's own icon colour, and the spin
     * comes from the adopted `checkbox.css` (`[mono-spinner]`), like the box itself.
     */
    protected _renderLoadingIcon(): TemplateResult;
}
export {};
