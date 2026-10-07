/**
 * Whether `key` can actually be assigned on `obj` — a plain expando, or an
 * accessor/data property that isn't read-only.
 *
 * This matters because a controller's `props` object legitimately carries keys
 * that are NOT element props: `monoDataGrid`'s `th[].summary` includes `prefix`
 * and `precision`, which the controller consumes for formatting. `prefix`
 * collides with the read-only native `Element.prefix`, and assigning it throws —
 * which took down the whole docs page render until this check existed.
 */
export declare function isSettable(obj: object, key: string): boolean;
/** `{ onChange, onToggle, onLoadingChange, … }` typed from a component's `*Events` interface. */
export type MonoEventProps<E> = {
    [K in Extract<keyof E, string> as K extends `${string}-${string}` ? never : `on${Capitalize<K>}`]?: (event: E[K]) => void;
};
/** Whether a props key names an event handler (`onClick`, `onLoadingChange`). */
export declare function isEventHandlerKey(key: string): boolean;
/**
 * `onClick` → `click`, `onLoadingChange` → `loading-change`, `onMnoChange` →
 * `mno-change` — the same rule Vue applies to an `on*` listener prop, so a key
 * that works in a template works here.
 */
export declare function eventNameFromHandlerKey(key: string): string;
/**
 * Remove every handler `applyProps` attached to `el`. Call it where an element
 * leaves its controller (an unbind, a re-bind to a different one) so the old
 * controller's handlers do not keep firing beside the new one's.
 */
export declare function detachEventHandlers(el: object): void;
/**
 * Write a controller's props onto an element.
 *
 * Two guards, both load-bearing:
 * - `undefined` values are skipped, so "not declared" never clobbers a value the
 *   template set;
 * - each write is equality-checked, so a sync can't schedule another update and
 *   loop.
 *
 * Handler keys (`onClick`, `onToggle`, …) become event listeners — see the
 * block above — never properties.
 *
 * Shared by `table-controller-core` (`monoDataGrid`/`monoDataDropdown` elements)
 * and `form-control-core` (`monoForm` controls) — the write loop is identical
 * and its failure modes are subtle enough to be worth having in one place.
 */
export declare function applyProps(el: object, patch: Record<string, unknown> | undefined): boolean;
