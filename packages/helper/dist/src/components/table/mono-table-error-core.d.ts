import { LitElement, TemplateResult } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { MonoErrorBehaviour, MonoTableError } from './mono-data-grid.js';
import { Constructor } from '../../composables/hybird-prop';
/** `detail` of the `close` event `<mono-table-error>` emits when its × is pressed. */
export interface TableErrorCloseEventDetail {
    /** The text that was showing. */
    message: string;
    /** The controller error it stood for, if any. */
    error: MonoTableError | null;
}
/** `detail` of the `reload` event `<mono-table-error>` emits when its ↻ is pressed. */
export interface TableErrorReloadEventDetail {
    error: MonoTableError | null;
}
export type TableErrorCloseEvent = CustomEvent<TableErrorCloseEventDetail>;
export type TableErrorReloadEvent = CustomEvent<TableErrorReloadEventDetail>;
/** Events emitted by `<mono-table-error>` (feeds the generated Vue types). */
export interface TableErrorEvents {
    close: TableErrorCloseEvent;
    reload: TableErrorReloadEvent;
    'mno-close': TableErrorCloseEvent;
    mnoClose: TableErrorCloseEvent;
    'mno-reload': TableErrorReloadEvent;
    mnoReload: TableErrorReloadEvent;
}
/** Public surface added by the error-bar core mixin. */
export declare class MonoTableErrorCoreInterface extends MonoTableControllerCoreInterface {
    message: string;
    dismissible: boolean;
    closeLabel: string;
    behaviour: MonoErrorBehaviour;
    reload: boolean;
    reloadLabel: string;
    protected renderIcon(name: 'close' | 'refresh'): TemplateResult;
}
/**
 * `MonoTableErrorCore` — render-mode-agnostic logic for `mono-table-error`, the
 * red bar shown under the header when a request fails.
 *
 * Unlike `mono-table-loading` and `mono-table-empty`, which paint OVER the grid,
 * this one is a real row in it, taking up honest height directly below the
 * header the way DevExtreme's error row does. The consumer writes that row —
 * `<tr><td colspan><mono-table-error/></td></tr>` — and the element ADOPTS it
 * (`ensureRowHost`): the row class the padding reset keys on, the zebra-skip
 * marker and a live `colspan` are stamped on, so the hand-written form needs
 * nothing but the two tags. Dropped bare into `<tbody>` it still wraps itself,
 * but that is invalid HTML — Vue warns, and it does not survive SSR — so it is
 * the fallback, not the taught form.
 *
 * **What it shows.** `message` if you set one — an explicit message is an
 * instruction, and it wins for as long as it is set. Otherwise the controller's
 * last caught error (`MonoTableController.error`), whose text comes from the
 * error itself rather than from a hardcoded string.
 *
 * **A failure clears the rows** (`behaviour="clear-list"`, the default): the
 * controller empties `items` when it records the error, so a rejected filter
 * never leaves the previous filter's rows under the bar. `"keep-list"` keeps
 * them. The setting is pushed to the controller (`setErrorBehaviour`), so it
 * holds whether or not this element is the one on screen.
 *
 * **Reload** (`reload`, default `true`): a ↻ beside the × that re-runs the
 * failed query (`table.reload()`). The bar stays until that succeeds.
 *
 * **Dismiss hides THIS element only.** The controller keeps its error, so
 * anything else bound to the same table still agrees that it happened. What
 * comes back is the next *failure*, not the next different message: the element
 * remembers the error object it dismissed, and the controller mints a fresh one
 * per failure, so an identical repeat error re-shows.
 *
 * **It stays in view.** The row is table-wide, and on a table wider than its
 * `.mono-table-scroll` that put the text at the far left and the ✕ / ↻ past the
 * right edge — invisible until you scrolled for them. So the bar inside the row
 * is `position: sticky; left: 0` at exactly the scrollport's width (`100cqw`,
 * the same container-query trick the loading spinner centres with — pure CSS in
 * `table.css`). Vertically it follows the HEADER: under `mono-table-sticky-head`
 * the row's cell is sticky too, `top` = the measured `<thead>` height, which this
 * element publishes as `--mono-table-error-head` on the `<table>` and keeps
 * fresh with a `ResizeObserver` (a banded two-row header, a caption that wraps).
 * A header that scrolls away takes the bar with it — it belongs to those rows.
 *
 * SSR-safe: all DOM work is guarded behind `isServer`.
 */
export declare const MonoTableErrorCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableErrorCoreInterface> & T;
