import { MonoFilterDataType, MonoFilterOperator, MonoFilterTexts } from './filter-types.js';
/** How many value inputs an operator needs. */
export type MonoFilterArity = 0 | 1 | 2 | 'many';
/** Value inputs required per operator — drives the value cell. */
export declare const OPERATOR_ARITY: Record<MonoFilterOperator, MonoFilterArity>;
export declare function operatorsFor(dataType?: MonoFilterDataType): MonoFilterOperator[];
/** The operator a field falls back to when its type has no current one. */
export declare function defaultOperator(dataType?: MonoFilterDataType): MonoFilterOperator;
/** English defaults for every label. `texts` overrides any of these. */
export declare const DEFAULT_TEXTS: Required<MonoFilterTexts>;
export declare function resolveTexts(texts?: MonoFilterTexts): Required<MonoFilterTexts>;
/** Coerce a raw input string to the field's data type for the emitted filter. */
export declare function coerceValue(raw: unknown, dataType?: MonoFilterDataType): unknown;
