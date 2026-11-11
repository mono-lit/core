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
/** Count occurrences of `field` across `rows` (path-aware; a wildcard path flattens). */
export declare function countValues(rows: readonly unknown[], field: string): MonoValueCount[];
//#endregion