import { MonoSearchExprEntry } from "../../search/search-expr.js";
import { MonoSearchValue } from "../../search/data-search.js";
import { MonoFormController } from "../form/form-types.js";
import { RowPredicate } from "../../search/filter-eval.js";
import { ApplyGate } from "../../utils/data-source-apply.js";
//#region src/components/table/filter-suggestion.d.ts
/** Where a field's ALLOWED values come from — a DataSource, a store, an array, or with an explicit key. */
export type MonoSuggestionValueSource = unknown | {
  source: unknown;
  /** The option row field holding the value (default: the form control's `keyValue`, then the row field). */
  keyValue?: string;
};
/** `<mono-table-search :suggestion-filter.prop="…">`. */
export interface MonoSuggestionFilter {
  /** Row field → form key, e.g. `{ CodeDept: 'Dept' }`. Required. */
  keys: Record<string, string>;
  /**
   * Allowed values per ROW field. Default: the option source of the form control
   * bound under that key (`dataSource`, else `items`).
   */
  sources?: Record<string, MonoSuggestionValueSource>;
  /**
   * Where rows are COUNTED — a DataSource, a store or an array. Default: the
   * grid's bound source. Its own `filter()` is NOT applied (it usually holds the
   * very form clause being relaxed); put a fixed base in {@link filter}.
   */
  source?: unknown;
  /** Search fields on {@link source}. Default: the grid's `searchValue()`. */
  searchValue?: MonoSearchValue;
  /**
   * A fixed base for the probe, ANDed in — a devextreme filter array, or a
   * getter returning one (a function taking NO arguments). For an array source a
   * row predicate `(row) => boolean` works too.
   */
  filter?: unknown;
  /** Search operation (default `contains`). */
  searchOperation?: string;
}
/** What a probe found — published on the grid, rendered by `<mono-table-empty>`. */
export interface MonoFilterSuggestion {
  /** Form key to change (`Dept`). */
  key: string;
  /** Row field it filters (`CodeDept`). */
  field: string;
  /** The suggested value (single), or the values being ADDED (array field). */
  value: unknown;
  /** Display text for {@link value}, from the control's `displayValue` when known. */
  caption: string;
  /** Rows that would match the search after adjusting. */
  count: number;
  /** The form value right now. */
  current: unknown;
  /** What Adjust writes: `form.setValues(values)`. */
  values: Record<string, unknown>;
}
/** The slice of the grid a probe reads — public `MonoTableController` members only. */
export interface ProbeGrid {
  searchTerms: Array<{
    value: string;
    field?: string;
  }>;
  dataSource: unknown;
  searchValue(): MonoSearchExprEntry[] | undefined;
}
export interface ProbeContext {
  grid: ProbeGrid;
  form: MonoFormController;
  /** Remembers a backend that rejected `$apply` (see `createApplyGate`). */
  gate: ApplyGate;
}
/** `field = v`, or an OR of them for several values. */
export declare function equalsAny(field: string, values: readonly unknown[]): unknown;
/** The search as a devextreme filter array (remote) — `null` when there is nothing to search. */
export declare function searchFilterFor(terms: ProbeGrid['searchTerms'], entries: readonly MonoSearchExprEntry[], operation?: string): unknown;
/** The search as a row predicate (array) — `null` when there is nothing to search. */
export declare function searchPredicateFor(terms: ProbeGrid['searchTerms'], entries: readonly MonoSearchExprEntry[], operation?: string): RowPredicate | null;
/**
 * The probe filter for relaxing `field`: every OTHER mapped field pinned to its
 * current form value (an empty value means "all" and pins nothing), ANDed with
 * the search and the fixed base. `field` itself stays free.
 */
export declare function buildProbeFilter(field: string, keys: Record<string, string>, values: Record<string, unknown>, search: unknown, base: unknown): unknown;
/** The bound form control's surface the probe reads (select / tag-input / dropdown-table). */
interface FormControlLike {
  readonly?: boolean;
  disabled?: boolean;
  dataSource?: unknown;
  items?: unknown[];
  keyValue?: string;
  displayValue?: string | ((item: any) => string);
}
/**
 * Which `candidates` the field allows, each with its caption. `null` when there is
 * NO source to check against (nothing bound, nothing configured) — the caller
 * then trusts the counts.
 */
export declare function allowedValues(spec: MonoSuggestionValueSource | undefined, control: FormControlLike | null, field: string, candidates: readonly unknown[]): Promise<Map<string, {
  value: unknown;
  caption: string;
}> | null>;
/**
 * Probe every mapped field and return the best single-field adjustment, or `null`
 * when nothing allowed would bring rows back.
 */
export declare function probeFilterSuggestion(cfg: MonoSuggestionFilter, ctx: ProbeContext): Promise<MonoFilterSuggestion | null>;
//#endregion
export {};