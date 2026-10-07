import { LitElement, TemplateResult } from 'lit';
declare const MonoTableDetailShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-detail-core.js').MonoTableDetailCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-table-detail` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 *
 * The toggle renders into a real shadow root, with the two chevrons inlined as SVG
 * (`mdi:chevron-right` / `mdi:chevron-down`) because a shadow root can't reach the
 * page-level icon utility CSS — the same trade the sort/search shadow builds make.
 * A consumer who sets a custom `icon` / `icon-expanded` class gets the class span
 * from the core — and the generated icon rules are adopted into this root so the
 * class actually paints, the same way `mono-table-empty` does it. Without that
 * the span is there and empty, which is what a `+` / `−` toggle looked like in
 * the shadow tab beside a light tab that showed both glyphs.
 *
 * The **panel row is light DOM by construction**: it is inserted into the
 * consumer's own `<tbody>`, outside this element's shadow root, so it is styled by
 * the global `dist/ui/index.css` in both builds. That is already true of the
 * `<table class="mono-table" mono-table>` around it, so nothing extra is asked of the
 * consumer here.
 *
 * Shares all behaviour via `MonoTableDetailCore`.
 */
export declare class MonoTableDetailShadow extends MonoTableDetailShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    /** Only when a CUSTOM class is in play — the defaults are inlined SVG. */
    private _maybeAdoptIcons;
    protected _renderIcon(): TemplateResult;
}
export {};
