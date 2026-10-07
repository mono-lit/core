import { LitElement, nothing, TemplateResult } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { Constructor } from '../../composables/hybird-prop';
import { MonoTableController } from './mono-data-grid.js';
/** `detail` of the `reload` event `<mono-table-empty>` emits when its button is pressed. */
export interface TableEmptyReloadEventDetail {
    grid: MonoTableController;
}
export type TableEmptyReloadEvent = CustomEvent<TableEmptyReloadEventDetail>;
/** Events emitted by `<mono-table-empty>` (feeds the generated Vue types). */
export interface TableEmptyEvents {
    reload: TableEmptyReloadEvent;
    'mno-reload': TableEmptyReloadEvent;
    mnoReload: TableEmptyReloadEvent;
}
/** Public surface added by the empty-state core mixin. */
export declare class MonoTableEmptyCoreInterface extends MonoTableControllerCoreInterface {
    icon: string;
    title: string;
    subtitle: string;
    reload: boolean;
    reloadLabel: string;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    /** Set by each build once `slot="body"` is known to hold something. */
    protected _hasBodySlot: boolean;
    /** Overridden by the shadow build to emit a real `<slot>`. */
    protected _renderBodySlot(): TemplateResult;
    protected _renderProps(): TemplateResult;
    protected _renderIcon(): TemplateResult | typeof nothing;
}
/**
 * `MonoTableEmptyCore` — render-mode-agnostic logic for `mono-table-empty`, the
 * message shown over a grid that came back with no rows.
 *
 * It is `mono-table-loading`'s pair: same `<caption>` host, same overlay geometry,
 * same controller binding — one covers the grid while a query runs, this one
 * covers it when the query returned nothing. Everything they share lives in
 * `table-overlay.ts`.
 *
 * **When it shows.** With a controller bound: only once that controller has
 * settled at least once (`hasLoaded`) AND has no rows AND is not loading. The
 * `hasLoaded` gate is the load-bearing one — a fresh controller reads
 * `items: [], loading: false`, which is indistinguishable from "loaded and
 * genuinely empty", so without it every table would flash "No data" on mount
 * before its first request had even been made.
 *
 * With NO controller bound it shows unconditionally, because then the consumer is
 * driving it with `v-if` / `v-show` and an element that hid itself would simply
 * never appear.
 *
 * **What it shows.** `icon`, then `title`, then `subtitle`, then a reload button —
 * each omitted when its prop is empty. A `slot="body"` replaces all four, so a
 * consumer can put arbitrary markup (or a mono component) in the same box and
 * keep the placement and centring for free.
 *
 * SSR-safe: all DOM work is guarded behind `isServer`.
 */
export declare const MonoTableEmptyCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableEmptyCoreInterface> & T;
