import type {
  MonoFilterDataType,
  MonoFilterOperator,
  MonoFilterTexts,
} from './filter-types.js'

/** How many value inputs an operator needs. */
export type MonoFilterArity = 0 | 1 | 2 | 'many'

/** Value inputs required per operator — drives the value cell. */
export const OPERATOR_ARITY: Record<MonoFilterOperator, MonoFilterArity> = {
  eq: 1,
  ne: 1,
  gt: 1,
  ge: 1,
  lt: 1,
  le: 1,
  contains: 1,
  notcontains: 1,
  startswith: 1,
  endswith: 1,
  in: 'many',
  between: 2,
  isblank: 0,
  isnotblank: 0,
}

/**
 * Operators offered per data type. Only OData-expressible ones: string functions
 * for text, comparisons for ordered types, equality for booleans. Every type keeps
 * the null checks, which serialise to `eq null` / `ne null`.
 */
const BY_TYPE: Record<MonoFilterDataType, MonoFilterOperator[]> = {
  string: [
    'contains',
    'notcontains',
    'startswith',
    'endswith',
    'eq',
    'ne',
    'in',
    'isblank',
    'isnotblank',
  ],
  number: ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'between', 'in', 'isblank', 'isnotblank'],
  date: ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'between', 'isblank', 'isnotblank'],
  datetime: ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'between', 'isblank', 'isnotblank'],
  boolean: ['eq', 'ne'],
}

export function operatorsFor(dataType: MonoFilterDataType = 'string'): MonoFilterOperator[] {
  return BY_TYPE[dataType] ?? BY_TYPE.string
}

/** The operator a field falls back to when its type has no current one. */
export function defaultOperator(dataType: MonoFilterDataType = 'string'): MonoFilterOperator {
  return operatorsFor(dataType)[0] ?? 'eq'
}

/** English defaults for every label. `texts` overrides any of these. */
export const DEFAULT_TEXTS: Required<MonoFilterTexts> = {
  matchPrefix: 'Match',
  matchSuffix: 'of the following rules:',
  addRule: 'Add rule',
  addGroup: 'Add group',
  addNested: 'Add nested rule',
  remove: 'Remove',
  apply: 'Apply',
  clear: 'Clear',
  valuePlaceholder: 'Enter a value',
  multiValuePlaceholder: 'Enter one or more values (comma separated)',
  emptyHint: 'No rules yet — add one to start filtering.',

  and: 'all',
  or: 'any',
  notAnd: 'not all',
  notOr: 'none',

  eq: 'is equal to',
  ne: 'is not equal to',
  gt: 'is greater than',
  ge: 'is greater than or equal to',
  lt: 'is less than',
  le: 'is less than or equal to',
  contains: 'contains',
  notcontains: 'does not contain',
  startswith: 'starts with',
  endswith: 'ends with',
  in: 'is one of',
  between: 'is between',
  isblank: 'is blank',
  isnotblank: 'is not blank',
}

export function resolveTexts(texts?: MonoFilterTexts): Required<MonoFilterTexts> {
  return { ...DEFAULT_TEXTS, ...(texts ?? {}) }
}

/** Coerce a raw input string to the field's data type for the emitted filter. */
export function coerceValue(raw: unknown, dataType: MonoFilterDataType = 'string'): unknown {
  if (raw === null || raw === undefined || raw === '') return raw
  if (dataType === 'number') {
    const n = Number(raw)
    return Number.isNaN(n) ? raw : n
  }
  if (dataType === 'boolean') {
    if (typeof raw === 'boolean') return raw
    const s = String(raw).toLowerCase()
    return s === 'true' || s === '1'
  }
  return raw
}
