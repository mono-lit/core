import { LitElement, TemplateResult } from 'lit';
declare const MonoButtonDropdown_base: import('../../composables/hybird-prop').Constructor<import('./button-dropdown-core.js').MonoButtonDropdownCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-button-dropdown` (default build,
 * `@mono-lit/helper/ui/button-dropdown`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). Unlike most components here it takes no slots: the whole
 * surface is the `buttons` array, so there is nothing to capture and none of the
 * light-DOM slot machinery is needed.
 *
 * All render-mode-agnostic logic lives in `MonoButtonDropdownCore`; the shadow
 * build shares it and only swaps the embedded button's tag.
 */
export declare class MonoButtonDropdown extends MonoButtonDropdown_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    /**
     * The panel is a STATIC element here, not something a helper returns.
     *
     * `PopupPortalController` moves it into a `<body>` portal on open and never
     * moves it back. A node produced inside a `${}` expression sits in a
     * `ChildPart` range, and ejecting it from that range breaks Lit on the next
     * render ("this `ChildPart` has no `parentNode`"). As a fixed template node it
     * has no range to leave — which is exactly why `mono-dropdown` is shaped this
     * way too.
     */
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-button-dropdown': MonoButtonDropdown;
    }
}
export {};
