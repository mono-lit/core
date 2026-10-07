import { LitElement } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { Constructor } from '../../composables/hybird-prop';
/** Public surface added by the loading-overlay core mixin. */
export declare class MonoTableLoadingCoreInterface extends MonoTableControllerCoreInterface {
    minDuration: number;
    loading: boolean | null;
}
/**
 * `MonoTableLoadingCore` — render-mode-agnostic logic for `mono-table-loading`, a
 * drop-in spinner overlay shown over the table whenever the bound controller is
 * fetching (sort / search / paging / reload / save). Place it in the
 * `.mono-table-scroll` wrapper, or inside the `<table>` wrapped in a `<caption>`
 * (a bare custom-element child of `<table>` is invalid HTML — see the tag doc),
 * and bind the controller with `:data-grid.prop` — no `v-show` wiring.
 *
 * It reads `dataGrid.loading` **synchronously on every controller notify** (not in
 * an async render) so it can't miss a fast query whose `loading` flips back before
 * Lit re-renders, and holds the overlay for a small minimum duration
 * (`min-duration`, default 350ms) so the feedback is always perceptible. The
 * overlay itself is toggled by an imperative `data-loading` attribute + CSS — the
 * element never needs to re-render for the state to flip.
 *
 * "Just works" details, applied to the nearest overlay host — the enclosing
 * `.mono-table-scroll` if present, else the `<table>`:
 *  - makes it a positioning context (`position: relative`) so the absolute overlay
 *    covers it (the consumer adds nothing);
 *  - holds the grid's height while active, so a source that momentarily clears its rows
 *    mid-query can't collapse it to a thin strip. The hold goes on the nearest BLOCK box (the
 *    scroll wrapper, else the table's parent) — never on the `<table>`, which would distribute
 *    the height over its rows and stretch the header instead of reserving space.
 *
 * MANUAL mode: set `loading` (`:loading="isBusy"`) and the element follows THAT instead of the
 * controller — for a busy state the controller can't see (several requests, a save in a store,
 * a page with no controller at all). `true` shows, `false` hides, whatever the controller says;
 * `null` / `undefined` (or no attribute) hands it back to the controller. `min-duration` holds
 * for both sources.
 *
 * SSR-safe: all DOM/timer work is guarded behind `isServer`.
 */
export declare const MonoTableLoadingCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableLoadingCoreInterface> & T;
