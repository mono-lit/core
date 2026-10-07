import { MonoFormController, MonoFormOptions } from './form-types.js';
/**
 * `monoForm()` — a headless form controller.
 *
 * The consumer authors the markup by hand and opts each control in with
 * `:data-form="form"` + `key-form="Name"`. The controller owns the value,
 * validation, cross-field reactions and the props pushed onto each element;
 * nothing here touches the DOM, so it is SSR-safe and testable on its own.
 *
 * Mirrors `monoDataGrid`'s controller shape: a plain object with coalesced
 * `subscribe`/`notify`, state mutated in place, and elements re-rendering off
 * the subscription.
 */
/** Renamed "control" alias of {@link monoForm} (no breaking change — both work). */
export { monoForm as controlMonoForm };
export declare function monoForm(options: MonoFormOptions): MonoFormController;
