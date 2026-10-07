// SSR-safe root subset for `@mono-lit/helper` (resolved via the package `node` export
// condition). It exports ONLY the pure data utilities — no custom-element modules,
// so importing `@mono-lit/helper` on the server never evaluates `class extends HTMLElement`.
//
// The browser keeps the full `./dist/index.js` entry (the `import` condition); this
// file is what Node/nitro loads. Components render on the client only (wrapped in
// `<ClientOnly>` by `monoSsr`), so the server never needs the element classes.

export { monoDataGrid, controlMonoTable } from '../components/table/mono-data-grid'
export { setErrorMessages, resolveErrorMessages, describeError, errorStatus, normalizeError, DEFAULT_ERROR_MESSAGES } from '../utils/normalize-error'
// App-wide default props for every mono component (light + shadow). Pure — no
// element module is imported, so this is safe on the server and before any
// component registers.
export { createMonoUI, getMonoUI, getMonoUIStatus, resetMonoUI } from '../composables/mono-ui'
export type { MonoUI, MonoUIConfig, MonoUIComponents, MonoUIStatus } from '../composables/mono-ui'
// The automatic skeleton behind the universal `pending` prop (phantom-ui). Pure as well:
// status / reset helpers and the types; activation itself is driven by the element registry.
export { getMonoSkeletonStatus, resetMonoSkeleton, isMonoSsrApp } from '../composables/mono-skeleton'
export type {
  MonoPending,
  MonoPendingOptions,
  MonoPhantomProps,
  MonoSkeletonDefaults,
  MonoSkeletonStatus,
} from '../composables/mono-skeleton'
export type { MonoErrorMessages, MonoErrorMessageKey, DescribedError } from '../utils/normalize-error'
// `monoForm` is a pure controller (no DOM), so it is safe in the node subset too.
export { monoForm, controlMonoForm } from '../components/form/mono-form-controller'
export type {
  MonoFormOptions,
  MonoFormController,
  MonoFormInput,
  MonoFormInputOf,
  MonoFormItem,
  MonoFormRule,
  MonoFormRuleCtx,
  MonoFormSchemaLike,
  MonoFormTiming,
  MonoFormValidation,
  MonoFormWatcherCtx,
  MonoFormComponent,
  MonoFormComponentProps,
  MonoFormProps,
  MonoFormSetProp,
  MonoFormSetValidation,
  MonoFormRefLike,
} from '../components/form/form-types'
// `monoModal` is headless too: `dialog.show()` touches the DOM only when called, and
// looks its elements up through `customElements` (registered by `@mono-lit/helper/ui/modal`).
export { monoModal, controlMonoModal } from '../components/modal/mono-modal-controller'
export type {
  MonoModalOptions,
  MonoModalController,
  MonoDialogOptions,
  MonoDialogButton,
  MonoDialogButtonCtx,
  MonoDialogController,
} from '../components/modal/modal-types'
export { monoArraySource } from '../components/table/array-source'
export { buildGroups, flattenLeaves, isGroupNode, collectGroupPaths } from '../components/table/grouping'
export {
  isPath,
  parseFieldPath,
  getFieldValue,
  setFieldValue,
  mergePatch,
  toODataSelector,
  toODataClause,
} from '../search/field-path'
export type { FieldSegment, ParsedFieldPath, ODataClause } from '../search/field-path'
// Pure factory (no custom-element side effects) — safe on the server. The
// chart ELEMENTS live behind `@mono-lit/helper/ui/chart` and are never imported here.
export { monoChart, controlMonoChart } from '../components/chart/mono-data-chart'
export { buildChartApply, buildChartOdataRequest, composeApply } from '../components/chart/chart-odata'
export type { MonoChartOdataRequest } from '../components/chart/chart-odata'
export type {
  MonoChartAgg,
  MonoChartController,
  MonoChartData,
  MonoChartDataset,
  MonoChartOptions,
  MonoChartOdataOptions,
  MonoChartAggregateCtx,
  MonoChartProps,
  MonoChartPointEvent,
  MonoChartSeries,
  MonoChartSource,
  MonoChartType,
} from '../components/chart/chart-types'
// Headless filter builder. Safe here: it pulls only pure helpers + types, never an
// element module, so importing it does not register any custom element.
export { monoFilterBuilder, controlMonoFilterBuilder } from '../components/filter/filter-builder'
export {
  arrayToODataString,
  arrayToTree,
  odataStringToArray,
  treeToArray,
} from '../components/filter/filter-odata'
export {
  DEFAULT_TEXTS as MONO_FILTER_TEXTS,
  OPERATOR_ARITY as MONO_FILTER_OPERATOR_ARITY,
  operatorsFor as monoFilterOperatorsFor,
} from '../components/filter/filter-operators'
export type {
  MonoFilterBuilderOptions,
  MonoFilterBuilderProps,
  MonoFilterController,
  MonoFilterDataType,
  MonoFilterExpression,
  MonoFilterField,
  MonoFilterGroup,
  MonoFilterGroupOperator,
  MonoFilterNode,
  MonoFilterOperator,
  MonoFilterOutput,
  MonoFilterChangeEvent,
  MonoFilterApplyEvent,
  MonoFilterClearEvent,
  MonoFilterChangeEventDetail,
  MonoFilterClearEventDetail,
  FilterBuilderEvents,
  MonoFilterProps,
  MonoFilterReadOptions,
  MonoFilterRule,
  MonoFilterSize,
  MonoFilterTexts,
} from '../components/filter/filter-types'

export { monoDataDropdown, controlMonoDataDropdown } from '../components/dropdown-table/mono-data-dropdown'
export type {
  MonoDropdownController,
  MonoDropdownItem,
  MonoDataDropdownOptions,
} from '../components/dropdown-table/mono-data-dropdown'

// Tooltip addon. Pure functions: no element is registered, and the optional
// `@floating-ui/dom` peer is imported lazily on the first show — so the root
// barrel stays safe on the server and for apps that never installed it.
export {
  controlMonoTooltip,
  monoTooltip,
  destroyAllMonoTooltips,
  createMonoTooltip,
  resetMonoTooltip,
  getMonoTooltipGlobal,
} from '../components/tooltip/index'
export type {
  MonoTooltipOptions,
  MonoTooltipGlobalOptions,
  MonoTooltipGlobal,
  MonoTooltipController,
  MonoTooltipTarget,
  MonoTooltipContent,
  MonoTooltipPlacement,
  MonoTooltipTrigger,
  MonoTooltipVariant,
  MonoTooltipColor,
  MonoTooltipSize,
} from '../components/tooltip/index'

export * from '../data/theme/index'
export * from '../data/theme/presets'

// The option shape `dataSourceOptions` / `odataOptions` accept — a value, a
// getter, or a `{ value }` box — and the reader the controllers use for it.
export { resolveMaybeReactive } from '../composables/reactive'
export type { MaybeReactive } from '../composables/reactive'

// The `on<Event>` keys every controller's `props` accepts (`onChange`, `onToggle`, …),
// typed from a component's `*Events` — so an app can type its own props stores.
export type { MonoEventProps } from '../composables/element-props'

// Types are erased at build; re-export for DX parity with the full root entry.
export type { MonoArraySourceOptions } from '../components/table/array-source'
export type { MonoGroupNode } from '../components/table/grouping'
export type {
  SortOrder,
  GroupPageInfo,
  MonoDisplayRow,
  MonoGroupMeta,
  MonoServerGroupCtx,
  MonoServerGroupSource,
  MonoSummaryType,
  MonoSummarySpec,
  MonoSummaryFieldSpec,
  MonoSummaryConfig,
  MonoSummaryRecalculate,
  MonoSummaryResult,
  MonoSummaryHandle,
  MonoColumnDef,
  MonoColumnHandle,
  MonoTableProps,
  MonoTableColumnProps,
  MonoSearchTerm,
  MonoDetailEl,
  MonoDetailHandle,
  MonoCheckMode,
  MonoCheckConfig,
  MonoCheckHandle,
} from '../components/table/mono-data-grid'
export type {
  MonoSearchCustomCtx,
  MonoSearchCustomResult,
  MonoSearchExpr,
  MonoSearchExprCustom,
  MonoSearchExprEntry,
} from '../search/search-expr'
// The shared search engine — the same `search-value` / `searchExpr` grammar the
// grid, select, tag-input and dropdown-table all run on.
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
} from '../search/data-search'
export type {
  MonoSearchValue,
  MonoSearchFieldsAliases,
  ResolveSearchFieldsOptions,
  ApplySourceSearchOptions,
  SearchableSource,
} from '../search/data-search'
// Report export (`table.export()`) — types only; the engine is dynamically
// imported by the controller, so nothing here reaches the server bundle.
export type {
  MonoExportColumn,
  MonoExportDetail,
  MonoExportDetailBatch,
  MonoExportFormat,
  MonoExportFormatOptions,
  MonoExportOptions,
  MonoExportResult,
  MonoExportStyle,
  MonoExportStyles,
} from '../export/types'
export type {
  MonoImportAmbiguity,
  MonoImportChange,
  MonoImportColumn,
  MonoImportMatch,
  MonoImportNumberFormat,
  MonoImportOptions,
  MonoImportRejection,
  MonoImportResult,
  MonoImportType,
  MonoImportValueType,
} from '../import/types'

export type {
  MonoTableController,
  MonoGridSource,
  MonoDataGridOptions,
  MonoDataSourceOptions,
  MonoOdataOptions,
  MonoDistinctValuesContext,
  TableSearchProps,
  TablePagingProps,
  TablePageSizeProps,
  TableInfoProps,
  TableSortProps,
  TableThProps,
  TableThSort,
  TableLoadingProps,
  TableSummaryProps,
  TableDetailProps,
  TableCheckboxProps,
} from '../components/table/table-types'
