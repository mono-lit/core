import { LitElement, TemplateResult } from 'lit';
declare const MonoDropdownTableShadow_base: import('../../composables/hybird-prop').Constructor<import('./dropdown-table-core.js').MonoDropdownTableCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-dropdown-table` (SSR build, `@mono-lit/helper/ui/shadow/dropdown-table`).
 * The FIELD renders in a real shadow root (chips painted by the component's own sheet);
 * the panel's regions are native `<slot>`s into which the consumer's LIGHT-DOM
 * `<table>` + `mono-table-*` project — so those stay light, exactly as in the light
 * build. The popup controller auto-detects the shadow host and does NOT portal; the
 * core's `_positionPanel` places the fixed panel at the trigger. Shares all logic via
 * `MonoDropdownTableCore`.
 */
export declare class MonoDropdownTableShadow extends MonoDropdownTableShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    private _onSlotChange;
    firstUpdated(changed: Map<string, unknown>): void;
    /** Mark a region whose `<slot>` has no assigned content `mono-empty` (light uses `:empty`). */
    private _scanRegions;
    /** Native `<slot>` per region (body = the default unnamed slot for the `<table>`). */
    protected _renderRegion(cls: string, name: string): TemplateResult;
}
export {};
