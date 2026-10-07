// Shadow-DOM / SSR build entry for table — `@mono-lit/helper/ui/shadow/table`.
//
// Registers the SAME six `mono-table-*` tags as the light build
// (`@mono-lit/helper/ui/table`), so a document must import only one of the two. This
// entry is a drop-in replacement for `ui/table`: it re-exports the identical
// utilities/types AND the shadow element classes + shared core mixins.
export { MonoTableSearchShadow } from './mono-table-search.shadow.js'
export { MonoTableSortShadow } from './mono-table-sort.shadow.js'
export { MonoTablePagingShadow } from './mono-table-paging.shadow.js'
export { MonoTablePagingGroupShadow } from './mono-table-paging-group.shadow.js'
export { MonoTablePageSizeShadow } from './mono-table-page-size.shadow.js'
export { MonoTableInfoShadow } from './mono-table-info.shadow.js'
export { MonoTableThShadow } from './mono-table-th.shadow.js'
export { MonoTableEmptyShadow } from './mono-table-empty.shadow.js'
export { MonoTableErrorShadow } from './mono-table-error.shadow.js'
export { MonoTableLoadingShadow } from './mono-table-loading.shadow.js'
export { MonoTableSummaryShadow } from './mono-table-summary.shadow.js'
export { MonoTableDetailShadow } from './mono-table-detail.shadow.js'
export { MonoTableCheckboxShadow } from './mono-table-checkbox.shadow.js'

// Shared core mixins (so downstream components can extend the SSR-safe logic).
export { MonoTableControllerCore } from './table-controller-core.js'
export { MonoTableSearchCore } from './mono-table-search-core.js'
export { MonoTableSortCore } from './mono-table-sort-core.js'
export { MonoTablePagingCore } from './mono-table-paging-core.js'
export { MonoTablePagingGroupCore } from './mono-table-paging-group-core.js'
export { MonoTablePageSizeCore } from './mono-table-page-size-core.js'
export { MonoTableInfoCore } from './mono-table-info-core.js'
export { MonoTableThCore } from './mono-table-th-core.js'
export { MonoTableEmptyCore } from './mono-table-empty-core.js'
export { MonoTableErrorCore } from './mono-table-error-core.js'
export { MonoTableLoadingCore } from './mono-table-loading-core.js'
export { MonoTableSummaryCore } from './mono-table-summary-core.js'
export { MonoTableDetailCore } from './mono-table-detail-core.js'
export { MonoTableCheckboxCore } from './mono-table-checkbox-core.js'
export type {
  TableCheckboxType,
  TableCheckboxChangeEvent,
  TableCheckboxChangeEventDetail,
  TableCheckboxEvents,
} from './mono-table-checkbox-core.js'
export type {
  TableDetailClickEvent,
  TableDetailClickEventDetail,
  TableDetailEvents,
} from './mono-table-detail-core.js'
export type {
  TableEmptyEvents,
  TableEmptyReloadEvent,
  TableEmptyReloadEventDetail,
} from './mono-table-empty-core.js'
export type {
  TableErrorEvents,
  TableErrorCloseEvent,
  TableErrorCloseEventDetail,
  TableErrorReloadEvent,
  TableErrorReloadEventDetail,
} from './mono-table-error-core.js'
export type { TableSearchIconName } from './mono-table-search-core.js'
export type { TableSortSlotName, TableSortIconName } from './mono-table-sort-core.js'
export type { TableThSlotName, TableThIconName, TableThAlign } from './mono-table-th-core.js'

// ── Utilities + types: identical surface to ./index.ts ──────────────────────
export { monoDataGrid } from './mono-data-grid.js'
export { setErrorMessages, resolveErrorMessages, describeError, errorStatus, normalizeError, DEFAULT_ERROR_MESSAGES } from '../../utils/normalize-error.js'
export type { MonoErrorMessages, MonoErrorMessageKey, DescribedError } from '../../utils/normalize-error.js'
export { monoArraySource } from './array-source.js'
export type { MonoArraySourceOptions } from './array-source.js'
export { buildGroups, flattenLeaves, isGroupNode, collectGroupPaths } from './grouping.js'
export type { MonoGroupNode } from './grouping.js'
export {
  expandWildcard,
  isWildcardPattern,
  normalizeSearchExpr,
  plainSearchColumns,
  resolveSearchEntries,
} from '../../search/search-expr.js'
export type {
  MonoSearchCustomCtx,
  MonoSearchCustomResult,
  MonoSearchExpr,
  MonoSearchExprCustom,
  MonoSearchExprEntry,
  ResolveSearchOptions,
} from '../../search/search-expr.js'

export type {
  SortOrder,
  GroupPageInfo,
  MonoDisplayRow,
  MonoGroupMeta,
  MonoServerGroupCtx,
  MonoServerGroupSource,
} from './mono-data-grid.js'

export type {
  MonoColumn,
  MonoColumnSort,
  MonoColumnValue,
  MonoSearchTerm,
  MonoEditableTrigger,
  MonoCellChange,
  MonoStagedChange,
  MonoGridStore,
  MonoSummaryType,
  MonoSummarySpec,
  MonoSummaryFieldSpec,
  MonoSummaryConfig,
  MonoSummaryRecalculate,
  MonoSummaryResult,
  MonoSummaryHandle,
  MonoColumnDef,
  MonoColumnHandle,
  MonoDetailEl,
  MonoDetailHandle,
  MonoCheckMode,
  MonoCheckConfig,
  MonoCheckHandle,
} from './mono-data-grid.js'

export type {
  MonoTableController,
  MonoGridSource,
  MonoDataGridOptions,
  TableSearchProps,
  TablePagingProps,
  TablePageSizeProps,
  TableInfoProps,
  TableSortProps,
  TableThProps,
  TableThSort,
  TableEmptyProps,
  TableErrorProps,
  TableLoadingProps,
  TableSummaryProps,
  TableDetailProps,
  TableCheckboxProps,
} from './table-types.js'
