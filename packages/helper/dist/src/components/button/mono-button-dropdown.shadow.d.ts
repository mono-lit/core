import { LitElement, TemplateResult } from 'lit';
declare const MonoButtonDropdownShadow_base: import('../../composables/hybird-prop').Constructor<import('./button-dropdown-core.js').MonoButtonDropdownCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-button-dropdown` — `@mono-lit/helper/ui/shadow/button-dropdown`,
 * registered as the DISTINCT tag `mono-shadow-button-dropdown` so it can coexist
 * with the light build in one document.
 *
 * Shares every behaviour with the light build through `MonoButtonDropdownCore`;
 * the only difference is `_buttonTag()`, which points the entries at
 * `mono-shadow-button` instead of `mono-button`.
 *
 * The panel is NOT portaled out of the shadow root — `PopupPortalController`
 * positions it in place for shadow builds — so it inherits these styles normally.
 */
export declare class MonoButtonDropdownShadow extends MonoButtonDropdownShadow_base {
    static styles: import('lit').CSSResult[];
    protected _buttonTag(): string;
    /**
     * Shadow buttons project through a native `<slot>` — they never relocate their
     * children — so entry content can stay a Lit template here, which also keeps
     * this build SSR-safe (no `document.createElement` at render time).
     */
    protected _declarativeItems(): boolean;
    /**
     * `buttons[].icon` is DATA-driven, so the icon element is created inside this
     * shadow root — where the page's `i-mdi-*` utilities don't reach, leaving the
     * entries icon-less. `withShadowUtilityStyles` can't cover it: that path
     * deliberately excludes icon selectors so the two strategies don't collide.
     *
     * `adoptIconStyles` is the matching mechanism — one shared, LIVE constructable
     * sheet that keeps repopulating until it has captured real `.i-…` glyph rules,
     * so adopting early (before UnoCSS has loaded) still paints once it does.
     * Called from both hooks for exactly that reason.
     */
    protected firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /** Panel written statically for the same reason as the light build. */
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-shadow-button-dropdown': MonoButtonDropdownShadow;
    }
}
export {};
