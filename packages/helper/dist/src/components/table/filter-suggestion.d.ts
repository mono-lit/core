import { MonoSearchExprEntry } from "../../search/search-expr.js";
import { MonoSearchValue } from "../../search/data-search.js";
import { MonoFormController } from "../form/form-types.js";
import { RowPredicate } from "../../search/filter-eval.js";
import { ApplyGate } from "../../utils/data-source-apply.js";
import { MonoTupleCount, MonoValueCount } from "../../utils/group-count.js";
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
  /**
   * How the rows are counted on a remote source.
   * - `'apply'` (default): ONE `$apply=groupby((…),aggregate($count as count))` request
   *   for every field — every value that has matches comes back with its count. Falls
   *   back to a `$select` scan when the server rejects `$apply`.
   * - `'count'`: one `$count` request PER allowed option of each field (`$top=0&$count=true`,
   *   a bare number back). For servers without `$apply` and short option lists — no rows
   *   are downloaded. Needs an OData store; capped by {@link maxCountRequests}.
   */
  requestType?: 'apply' | 'count';
  /** `requestType: 'count'` only — most `$count` requests per field (default 30). */
  maxCountRequests?: number;
  /**
   * Most offers kept, largest count first (default 10). The first is what
   * `<mono-table-empty>`'s Adjust Filter button applies; all of them are listed in
   * the dropdown beside it.
   */
  maxOffers?: number;
  /**
   * Log every probe step to the console — the search sent, the per-value counts,
   * which candidates the field allows — and the reason when nothing is offered
   * (a readonly field, an empty "all values" field, no candidates, none allowed).
   */
  debug?: boolean;
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
  /**
   * The field's label — `inputs[key].props.label` from `controlMonoForm`, else the
   * bound control's `label`, else the form key. For wording: "… in another {label}".
   */
  label: string;
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
/**
 * One case-insensitive search clause for a plain / path field.
 *
 * The probe's filter reaches the server as TEXT — inside an `$apply`, or a `$filter`
 * written into the url — never through devextreme's compiler, so its usual
 * `tolower` (`oDataFilterToLower`) never happens. It is written here instead:
 * `contains(tolower(CompanyName),'shopee')`, as a raw one-element clause.
 * A wildcard path comes back from `toODataClause` as an `any()` lambda that is
 * already lowercased.
 */
export declare function lowerSearchClause(field: string, op: string, value: string): unknown;
/** The search as a filter array (remote) — `null` when there is nothing to search. */
export declare function searchFilterFor(terms: ProbeGrid['searchTerms'], entries: readonly MonoSearchExprEntry[], operation?: string): unknown;
/** The search as a row predicate (array) — `null` when there is nothing to search. */
export declare function searchPredicateFor(terms: ProbeGrid['searchTerms'], entries: readonly MonoSearchExprEntry[], operation?: string): RowPredicate | null;
/**
 * The probe filter for relaxing `field`: every OTHER mapped field pinned to its
 * current form value (an empty value means "all" and pins nothing), ANDed with
 * the search and the fixed base. `field` itself stays free.
 */
export declare function buildProbeFilter(field: string, keys: Record<string, string>, values: Record<string, unknown>, search: unknown, base: unknown): unknown;
type ProbeLog = ((step: string, data?: unknown) => void) | undefined;
/**
 * Per-value counts for relaxing `field` alone: the combos where every OTHER relaxed
 * field still equals its form value, summed by `field`'s value.
 */
export declare function sliceForField(combos: readonly MonoTupleCount[], field: string, others: ReadonlyArray<{
  field: string;
  current: unknown;
}>): MonoValueCount[];
/** The bound form control's surface the probe reads (select / tag-input / dropdown-table). */
interface FormControlLike {
  readonly?: boolean;
  disabled?: boolean;
  dataSource?: unknown;
  items?: unknown[];
  keyValue?: string;
  displayValue?: string | ((item: any) => string);
  label?: string;
}
/**
 * Which `candidates` the field allows, each with its caption. `null` when there is
 * NO source to check against (nothing bound, nothing configured) — the caller
 * then trusts the counts.
 */
export declare function allowedValues(spec: MonoSuggestionValueSource | undefined, control: FormControlLike | null, field: string, candidates: readonly unknown[], log?: ProbeLog): Promise<Map<string, {
  value: unknown;
  caption: string;
}> | null>;
/**
 * EVERY option the field offers (keyed by `String(value)`, with its caption) — the
 * candidate list for `requestType: 'count'`. Same source resolution as
 * {@link allowedValues}; a DataSource is read with its own `filter()`, so the
 * per-user restriction applies. `null` when there is no option source at all.
 */
export declare function optionValues(spec: MonoSuggestionValueSource | undefined, control: FormControlLike | null, field: string, log?: ProbeLog): Promise<Map<string, {
  value: unknown;
  caption: string;
}> | null>;
/**
 * Probe every mapped field and return EVERY single-field adjustment that would bring
 * rows back and that the user may pick — largest count first, so `[0]` is the best.
 * Empty when there is nothing to offer.
 */
export declare function probeFilterSuggestions(cfg: MonoSuggestionFilter, ctx: ProbeContext): Promise<MonoFilterSuggestion[]>;
/** The single best offer — {@link probeFilterSuggestions}`[0]`, or `null`. */
export declare function probeFilterSuggestion(cfg: MonoSuggestionFilter, ctx: ProbeContext): Promise<MonoFilterSuggestion | null>;
//#endregion
export {};