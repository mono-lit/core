import { LitElement } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { MonoSummaryType } from './mono-data-grid.js';
import { Constructor } from '../../composables/hybird-prop';
/** Public surface added by the summary core mixin. */
export declare class MonoTableSummaryCoreInterface extends MonoTableControllerCoreInterface {
    field?: string;
    type?: MonoSummaryType;
    name?: string;
}
/**
 * `MonoTableSummaryCore` — render-mode-agnostic logic for `mono-table-summary`: an
 * aggregate footer cell. The aggregate (type + formatting) is configured centrally
 * in `monoDataGrid(data, { summary: [...] })`; this element only names which
 * summary to show (`field`, optionally `type`/`name`) and renders the controller's
 * formatted result, re-rendering whenever the controller notifies.
 *
 * A `field` with no central spec falls back to a `sum` (the controller
 * auto-registers a default), so a bare `<mono-table-summary field="Price">` also
 * works with zero config.
 *
 * No slots, no icons — light and shadow share the full `render()`.
 *
 * SSR-safe: `dataGrid` is undefined on the server, so it renders an empty shell.
 */
export declare const MonoTableSummaryCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableSummaryCoreInterface> & T;
