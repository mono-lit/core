/** Generic constructor type for Lit mixins: `<T extends Constructor<LitElement>>`. */
export type Constructor<T = object> = new (...args: any[]) => T;
export declare function toKebabCase(value: string): string;
export declare function toLowerCaseProp(value: string): string;
export declare function defineHybridPropAliases<T extends object>(target: T, props: string[]): void;
/**
 * Register a cross-name alias for a controller-binding prop — e.g.
 * `defineHybridPropAlias(el, 'controlTable', 'dataGrid')` makes `controlTable`,
 * `control-table` and `controltable` all read/write the canonical reactive
 * `dataGrid` property (so `.controlTable = …` still triggers Lit's update
 * cycle). Used to rename the controller props without a breaking change: the
 * new `control-*` spellings land here while the old `data-*` ones keep working.
 */
export declare function defineHybridPropAlias<T extends object>(target: T, aliasCamel: string, realProp: string): void;
/**
 * Lit `hasChanged` for an array prop.
 *
 * **Load-bearing**, for exactly the reason `rateLimitHasChanged` is (see
 * `composables/rate-limit.ts`): `:items="[...]"` in a template allocates a NEW array
 * on every parent re-render. Under Lit's default `!==` the element sees a change
 * each time, so anything gated on `changed.has('items')` — resetting an
 * infinite-scroll page, invalidating a search memo, rebuilding a cache — runs on
 * renders where nothing about the data actually moved.
 *
 * Element-wise identity rather than a deep compare: rows are normally stable objects
 * owned by a store, so this catches the re-created-wrapper case cheaply. If the
 * consumer also rebuilds each row object the arrays are reported as different, which
 * is the safe direction.
 *
 * **Why this needs no "repair" step, unlike `mono-button-dropdown`.** That element
 * compares entries by CONTENT and deliberately ignores function fields, so it reports
 * "same" for entries that really were rebuilt — leaving cached listener state pointing
 * at the previous array (hence `_retargetItemParts()`). `arrayHasChanged` says "same"
 * only when the array holds literally the same objects in the same order, so nothing
 * item-related can have moved and there is nothing to retarget. Reach for the deeper
 * compare only where the callbacks are resolved late, and prove it.
 *
 * **Do NOT add this (or any `hasChanged`) to these — they hang real work off the
 * update cycle, so suppressing an update silently drops it:**
 *   - `chart-core.ts` — `updated()` IS the chart pipeline; its last step `_applyData()`
 *     is the only place chart.js is redrawn. A skipped update freezes the canvas.
 *   - `date-core.ts` — `updated()` drives `_rebuild()` / `_applyModelValue()`, so
 *     flatpickr would be stranded on stale config.
 *   - every `mono-table-*` element — `table-controller-core.ts` overrides `update()` to
 *     pull each element's slice of `monoDataGrid({ props })`.
 *   - every `monoForm`-bound control and `filter-builder-core.ts` — same `update()` hook
 *     (`form-control-core.ts`), used for form binding and visibility.
 *
 * Surveyed 2026-08-17 across all 26 component directories; the guarded props are
 * `select`/`tag-input` `items`, `tag-input` `modelValue`/`value`, `menu` +
 * `mono-menu-list` `items`, `tabs` `items`, both `breadcrumb` `items`, and
 * `file-upload` `modelValue`.
 */
export declare function arrayHasChanged(value: unknown, old: unknown): boolean;
export declare const booleanStringConverter: {
    fromAttribute(value: unknown): boolean;
    toAttribute(value: boolean): string | null;
};
export declare const numberStringConverter: {
    fromAttribute(value: string | null): number;
    toAttribute(value: number): string | null;
};
/**
 * Like {@link numberStringConverter}, but an absent/blank attribute stays
 * `undefined` instead of collapsing to `0`.
 *
 * Needed wherever 0 is a meaningful value AND "not set" has to mean "fall back to
 * whatever the component computes" — e.g. `mono-modal` / `mono-drawer`'s `z-index`,
 * where 0 is a legal stacking level and unset means "let the popup stack decide".
 * Using the plain number converter there would pin every dialog to `z-index: 0`.
 */
export declare const optionalNumberConverter: {
    fromAttribute(value: string | null): number | undefined;
    toAttribute(value: number | undefined): string | null;
};
export declare const stringConverter: {
    fromAttribute(value: string | null): string;
    toAttribute(value: string): string | null;
};
