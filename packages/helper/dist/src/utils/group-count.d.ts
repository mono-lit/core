import { ApplyGate } from "./data-source-apply.js";
//#region src/utils/group-count.d.ts
export interface MonoValueCount {
  value: unknown;
  count: number;
}
/**
 * Group-count `field` through `store` with ONE `$apply`, or `null` when that path
 * is not available — the gate is off, a wildcard path (nothing to group by), a
 * store that cannot carry an `$apply` (a CustomStore), a failed request (reported
 * to the gate), or a response that is not rolled up (a server that ignored the
 * clause). An EMPTY grouped result is a real answer and comes back as `[]`.
 *
 * The rows are returned in server order — the caller sorts.
 */
export declare function groupCountViaApply(store: unknown, field: string, filter: unknown, gate: ApplyGate, options?: {
  top?: number;
}): Promise<MonoValueCount[] | null>;
/** One row of a multi-field group count: the value of each grouped field, and how many rows. */
export interface MonoTupleCount {
  values: Record<string, unknown>;
  count: number;
}
/**
 * {@link groupCountViaApply} over SEVERAL fields at once — one
 * `groupby((A,B),aggregate($count as count))` request, one row per combination
 * that exists. Same `null` contract.
 */
export declare function groupCountsViaApply(store: unknown, fields: readonly string[], filter: unknown, gate: ApplyGate, options?: {
  top?: number;
}): Promise<MonoTupleCount[] | null>;
/** {@link countValues} over several fields: one tuple per combination, with its row count. */
export declare function countTuples(rows: readonly unknown[], fields: readonly string[]): MonoTupleCount[];
/** Count occurrences of `field` across `rows` (path-aware; a wildcard path flattens). */
export declare function countValues(rows: readonly unknown[], field: string): MonoValueCount[];
//#endregion