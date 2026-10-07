import { LitElement } from 'lit';
import { Constructor } from '../../composables/hybird-prop';
import { MonoVisibleType } from '../../composables/visibility';
import { MonoFormController, MonoFormListEntry } from './form-types.js';
/** Public surface added by the form-control mixin. */
export declare class MonoFormControlCoreInterface {
    dataForm?: MonoFormController;
    keyForm?: string;
    visible: boolean;
    visibleType: MonoVisibleType;
    protected _formOff?: () => void;
    protected _syncFromForm(): void;
    /** Publish resolved options onto `form.items()[key].list` — list controls only. */
    protected _publishList(entries: MonoFormListEntry[]): void;
}
/**
 * `MonoFormControlCore` — the element half of {@link monoForm}.
 *
 * Mirrors `table/table-controller-core.ts`: a `.prop`-bound controller
 * (`attribute: false`), hybrid aliases so `:data-form` / `:dataForm` /
 * `dataform` all land, and a subscribe lifecycle that re-syncs on notify. On top
 * of that it does three things the table base doesn't need:
 *
 * 1. **Reports changes.** Listens to its own `mno-input` / `mno-change` and
 *    pushes them into the controller with the matching timing (`live` /
 *    `change`), which is what drives the rules.
 * 2. **Applies state.** On every notify it writes the form's value, validation
 *    and merged props onto itself — assigning ONLY when the value differs, so an
 *    element updating itself can't feed back into another notify.
 * 3. **Lets the form win.** The controller owns the value, so it overwrites a
 *    local `:model-value`; `inputs[key].props` is merged last by the controller and so
 *    beats both the `setProp()` method and anything the template set.
 *
 * SSR-safe: `dataForm` can't cross Declarative Shadow DOM, so on the server this
 * is inert and the element renders its normal shell.
 */
export declare const MonoFormControlCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoFormControlCoreInterface> & T;
