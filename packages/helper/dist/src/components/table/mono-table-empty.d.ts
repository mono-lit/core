import { LitElement } from 'lit';
declare const MonoTableEmpty_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-empty-core.js').MonoTableEmptyCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-empty` (default build, `@mono-lit/helper/ui/table`).
 *
 * The message shown over a grid that came back with no rows — `mono-table-loading`'s
 * pair, and placed the same way:
 *
 * ```html
 * <caption>
 *   <mono-table-empty :control-table.prop="table" title="No people found" />
 * </caption>
 * ```
 *
 * Everything else — when it shows, what it shows, the overlay geometry — is in
 * `MonoTableEmptyCore`. This build only adds the light-DOM half of `slot="body"`:
 * the consumer's markup is captured out of the host before the first render and
 * re-placed into the rendered region afterwards, because a light build renders
 * INTO the host and would otherwise overwrite it.
 */
export declare class MonoTableEmpty extends MonoTableEmpty_base {
    static styles: import('lit').CSSResult[];
    private _buckets;
    private _slotsCaptured;
    protected createRenderRoot(): HTMLElement;
    connectedCallback(): void;
    private _captureSlots;
    protected updated(changed: Map<string, unknown>): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-empty': MonoTableEmpty;
    }
}
export {};
