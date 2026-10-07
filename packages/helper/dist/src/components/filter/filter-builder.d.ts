import { MonoFilterBuilderOptions, MonoFilterController } from './filter-types.js';
/**
 * `monoFilterBuilder` — headless controller behind `<mono-filter-builder>`.
 *
 * Owns the editable node tree and converts it to/from the two wire shapes. The
 * element is pure presentation: it reads `tree` / `fields` / `texts` and calls the
 * edit methods, then re-renders on `subscribe`.
 *
 * `filter` is **shape-flexible** — a devextreme array is normalised, an OData
 * `$filter` string is parsed, decided by `typeof`, with no extra option. The output
 * shape is chosen independently when reading (`original`/`changed` + `type`), so a
 * string can go in and an array come out.
 *
 * @example
 * const filter = monoFilterBuilder({
 *   fields: [{ field: 'Name', caption: 'Name', dataType: 'string' }],
 *   filter: "contains(Name,'Andy')",
 * })
 * filter.changed({ type: 'array' })   // [['Name','contains','Andy']]
 */
/** Renamed "control" alias of {@link monoFilterBuilder} (no breaking change — both work). */
export { monoFilterBuilder as controlMonoFilterBuilder };
export declare function monoFilterBuilder(opts?: MonoFilterBuilderOptions): MonoFilterController;
