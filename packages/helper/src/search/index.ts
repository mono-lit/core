/**
 * `@mono-lit/helper/search` — the shared data-search module.
 *
 * Everything about "which fields does a typed term match, and how does that
 * become a filter" lives here, independent of any component: path expressions,
 * `*` patterns, custom clause builders, the client predicate, the remote
 * `$filter`, and the DataSource application strategy.
 *
 * Consumed by `monoDataGrid`, `mono-select`, `mono-tag-input` and
 * `mono-dropdown-table`. It imports nothing outside this folder, so it can be
 * lifted into another package unchanged.
 */

// Path field expressions — `Job.Name`, `User.[1].Id`, `User.[*].Name`.
export {
  isPath,
  parseFieldPath,
  getFieldValue,
  setFieldValue,
  projectFields,
  mergePatch,
  toODataSelector,
  odataLiteral,
  odataComparison,
  toODataClause,
} from './field-path.js'
export type { FieldSegment, ParsedFieldPath, ODataClause } from './field-path.js'

// devextreme filter arrays → client predicates, and filter composition.
export { compileFilterPredicate, andFilters, andPredicates, joinFilters } from './filter-eval.js'
export type { RowPredicate } from './filter-eval.js'

// Search-expression entries — plain columns, paths, `*` patterns, customs.
export {
  normalizeSearchExpr,
  plainSearchColumns,
  searchEntryField,
  searchEntryFor,
  hasCustomSearch,
  hasWildcardSearch,
  isWildcardPattern,
  expandWildcard,
  resolveSearchEntries,
  customRemoteClause,
  customPredicate,
} from './search-expr.js'
export type {
  MonoSearchCustomCtx,
  MonoSearchCustomResult,
  MonoSearchExpr,
  MonoSearchExprCustom,
  MonoSearchExprEntry,
  ResolveSearchOptions,
} from './search-expr.js'

// OData CSDL → safe remote search expressions.
export { odataSearchExpr } from './odata-search.js'
export type { MonoODataSearchOptions } from './odata-search.js'

// The engine: `search-value` parsing, resolution, and the two output shapes.
export {
  DEFAULT_SEARCH_OPERATION,
  SEARCH_FIELDS_KEYS,
  parseSearchValue,
  mergeSearchFields,
  resolveSearchFields,
  isFoldableSearch,
  plainSearchFields,
  readSearchField,
  searchRowPredicate,
  searchRemoteFilter,
  MonoSourceSearch,
} from './data-search.js'
export type {
  MonoSearchValue,
  MonoSearchFieldsAliases,
  ResolveSearchFieldsOptions,
  ApplySourceSearchOptions,
  SearchableSource,
} from './data-search.js'
