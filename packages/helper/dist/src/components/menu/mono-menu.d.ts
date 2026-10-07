import { LitElement, TemplateResult } from 'lit';
declare const MonoMenu_base: import('../../composables/hybird-prop').Constructor<import('./menu-core.js').MonoMenuCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-menu` (`@mono-lit/helper/ui/menu`).
 *
 * Renders into `this` (`createRenderRoot()=>this`) and keeps the full light-DOM
 * feature set: declarative `slot="body"` composition with `<mono-menu-list>`
 * children, per-item `slot="icon-${id}"` slots, and the child registry. All
 * render-mode-agnostic logic (props, selection/open state, events, public API)
 * lives in `MonoMenuCore`.
 */
export declare class MonoMenu extends MonoMenu_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _hasBodySlot;
    /** Captured nodes for the whole-body slot — `slot="body"`. */
    private _slotBody;
    private _orphanHolder?;
    connectedCallback(): void;
    private _captureSlots;
    protected updated(changed: Map<string, unknown>): void;
    private _placeIconSlots;
    private _placeBodySlot;
    /**
     * When any prop that influences the rendered content of descendant
     * `<mono-menu-list>` instances changes, ask each registered child to
     * re-render so they stay in lockstep with the parent.
     */
    private _notifyListChildren;
    /** Light body — declarative `slot="body"` placeholder, else items-driven. */
    protected _renderBody(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-menu': MonoMenu;
    }
}
export {};
