import { LitElement } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { Constructor } from '../../composables/hybird-prop';
/** Public surface added by the info core mixin. */
export declare class MonoTableInfoCoreInterface extends MonoTableControllerCoreInterface {
    template: string;
}
/**
 * `MonoTableInfoCore` — render-mode-agnostic logic for `mono-table-info`: a
 * read-only summary line (`Showing {from}–{to} of {total}`) driven by the
 * controller. No slots, no icons — light and shadow share the full `render()`.
 */
export declare const MonoTableInfoCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableInfoCoreInterface> & T;
