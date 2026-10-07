// pkg/mock-db/apply.ts — the OData v4 `$apply` aggregation extension.
//
// `$apply` is a TRANSFORMATION PIPELINE, not a flag. Segments are separated by `/`
// and each one feeds the next:
//
//   $apply=filter(Price gt 10)/groupby((Category),aggregate(Price with sum as Total))
//
// Two things are easy to get wrong and both give plausible-looking but wrong numbers:
//
//  1. `filter(...)` INSIDE $apply runs BEFORE the grouping. A top-level `$filter`
//     is a different thing: per spec it applies AFTER the aggregation, to the
//     grouped rows (`$filter=Total gt 500`). Swap them and you compute the right
//     aggregate over the wrong set.
//  2. `@odata.count` must then count the GROUPS, not the source rows.
//
// Supported: filter(...), groupby((A,B), aggregate(...)), bare aggregate(...),
// `$count as Alias`, and `identity`. Chained with `/`.
// Not supported: compute(), expand(), rollup/nested groupby, having, concat.
//
// Pure — no storage, no DOM.
//
// NOTE this module deliberately does NOT import from `./odata`: odata.ts imports
// `applyTransforms` from here, so importing the filter helpers back would create a
// circular module graph. Instead the caller injects a filter compiler
// (`compileFilter`), which keeps the dependency one-way.

/** Compiles a `$filter` expression into a row predicate. Injected to avoid an import cycle. */
export type CompileFilter = (expression: string) => (row: Record<string, any>) => boolean

/**
 * Reads a property that may be a NAVIGATION PATH (`PostBudget/ParentName`).
 *
 * Injected for the same reason as `compileFilter`: the path resolver lives in
 * odata.ts, which imports this module. Without it `groupby((PostBudget/ParentName))`
 * read a flat field, found nothing, and silently collapsed every row into one
 * `null` group — the aggregate looked plausible and was wrong.
 */
export type ReadValue = (row: Record<string, any>, field: string) => unknown

export type AggregateMethod =
    | 'sum'
    | 'average'
    | 'min'
    | 'max'
    | 'count'
    | 'countdistinct'

export interface AggregateSpec {
    /** Source field. Absent for `$count as X`. */
    field?: string
    method: AggregateMethod
    /** Output property name (`... as Alias`). */
    alias: string
}

export type ApplyTransform =
    | { kind: 'filter'; expression: string }
    | { kind: 'groupby'; fields: string[]; aggregates: AggregateSpec[] }
    | { kind: 'aggregate'; aggregates: AggregateSpec[] }
    | { kind: 'identity' }

import { readCall, splitTopLevel } from './split'

/** Split the pipeline on `/`, but only at depth 0 so `groupby((A),aggregate(...))` stays whole. */
function splitSegments(input: string): string[] {
    return splitTopLevel(input, '/')
}

const METHODS: AggregateMethod[] = ['sum', 'average', 'min', 'max', 'count', 'countdistinct']

/** `Price with sum as Total` | `$count as Rows`. */
function parseAggregateSpec(input: string): AggregateSpec {
    const text = input.trim()

    // $count as Alias
    const countMatch = /^\$count\s+as\s+([A-Za-z0-9_$]+)$/i.exec(text)
    if (countMatch) {
        return { method: 'count', alias: countMatch[1]! }
    }

    // Field with <method> as Alias
    const match = /^([A-Za-z0-9_$/]+)\s+with\s+([A-Za-z]+)\s+as\s+([A-Za-z0-9_$]+)$/i.exec(text)
    if (!match) {
        throw new Error(
            `$apply: cannot parse aggregate "${text}" — expected "Field with sum as Alias" or "$count as Alias"`,
        )
    }

    const method = match[2]!.toLowerCase() as AggregateMethod
    if (!METHODS.includes(method)) {
        throw new Error(
            `$apply: unsupported aggregate method "${match[2]}" (expected ${METHODS.join(' | ')})`,
        )
    }

    return { field: match[1]!, method, alias: match[3]! }
}

export function parseApply(input: string): ApplyTransform[] {
    return splitSegments(input).map((segment): ApplyTransform => {
        if (/^identity$/i.test(segment)) return { kind: 'identity' }

        const filterBody = readCall(segment, 'filter')
        if (filterBody != null) return { kind: 'filter', expression: filterBody }

        const aggregateBody = readCall(segment, 'aggregate')
        if (aggregateBody != null) {
            return {
                kind: 'aggregate',
                aggregates: splitTopLevel(aggregateBody).map(parseAggregateSpec),
            }
        }

        const groupBody = readCall(segment, 'groupby')
        if (groupBody != null) {
            // groupby((A,B) , aggregate(...))  — first arg is a paren'd field list
            const args = splitTopLevel(groupBody)
            const fieldList = (args[0] ?? '').trim()

            if (!fieldList.startsWith('(') || !fieldList.endsWith(')')) {
                throw new Error(
                    `$apply: groupby needs a parenthesised property list, e.g. groupby((Category))`,
                )
            }

            const fields = splitTopLevel(fieldList.slice(1, -1))
                .map((field) => field.trim())
                .filter(Boolean)

            if (!fields.length) throw new Error('$apply: groupby needs at least one property')

            let aggregates: AggregateSpec[] = []
            const rest = args.slice(1).join(',').trim()
            if (rest) {
                const inner = readCall(rest, 'aggregate')
                if (inner == null) {
                    throw new Error(
                        `$apply: only aggregate(...) is supported inside groupby, got "${rest}"`,
                    )
                }
                aggregates = splitTopLevel(inner).map(parseAggregateSpec)
            }

            return { kind: 'groupby', fields, aggregates }
        }

        throw new Error(
            `$apply: unsupported transformation "${segment}" ` +
            `(supported: filter, groupby, aggregate, identity)`,
        )
    })
}

/* -------------------------------- evaluate -------------------------------- */

/** Case-insensitive flat read — the fallback when no path-aware reader is injected. */
function readField(row: Record<string, any>, name: string): unknown {
    if (name in row) return row[name]
    const lower = name.toLowerCase()
    const hit = Object.keys(row).find((key) => key.toLowerCase() === lower)
    return hit ? row[hit] : undefined
}

function computeAggregate(
    rows: Record<string, any>[],
    spec: AggregateSpec,
    read: ReadValue,
): unknown {
    if (spec.method === 'count') return rows.length

    const values = rows
        .map((row) => read(row, spec.field!))
        .filter((value) => value !== undefined && value !== null)

    if (spec.method === 'countdistinct') {
        return new Set(values.map((value) => JSON.stringify(value))).size
    }

    const numbers = values.map(Number).filter((value) => !Number.isNaN(value))

    // An empty set sums to 0 but has no min/max/average — null, not 0, which would
    // read as a real measurement.
    if (!numbers.length) return spec.method === 'sum' ? 0 : null

    switch (spec.method) {
        case 'sum': return numbers.reduce((total, value) => total + value, 0)
        case 'average': return numbers.reduce((total, value) => total + value, 0) / numbers.length
        case 'min': return Math.min(...numbers)
        case 'max': return Math.max(...numbers)
        default: return null
    }
}

/** Stable group key for a set of fields (each may be a navigation path). */
function groupKeyOf(row: Record<string, any>, fields: string[], read: ReadValue): string {
    return JSON.stringify(fields.map((field) => read(row, field) ?? null))
}

/** Run the pipeline. Each transform's output feeds the next. */
export function applyTransforms(
    rows: Record<string, any>[],
    transforms: ApplyTransform[],
    compileFilter: CompileFilter,
    readValue: ReadValue = readField,
): Record<string, any>[] {
    const read = readValue
    let current = [...rows]

    for (const transform of transforms) {
        switch (transform.kind) {
            case 'identity':
                break

            case 'filter': {
                // runs BEFORE any grouping — this is the whole point of filter() living
                // inside $apply rather than being a top-level $filter
                const predicate = compileFilter(transform.expression)
                current = current.filter(predicate)
                break
            }

            case 'aggregate': {
                const single: Record<string, any> = {}
                for (const spec of transform.aggregates) {
                    single[spec.alias] = computeAggregate(current, spec, read)
                }
                // aggregate() over the whole set collapses to exactly one row
                current = [single]
                break
            }

            case 'groupby': {
                const groups = new Map<string, Record<string, any>[]>()

                for (const row of current) {
                    const key = groupKeyOf(row, transform.fields, read)
                    const bucket = groups.get(key)
                    if (bucket) bucket.push(row)
                    else groups.set(key, [row])
                }

                current = [...groups.values()].map((bucket) => {
                    const out: Record<string, any> = {}

                    // The grouped properties, read off the first member. A navigation path
                    // (`PostBudget/ParentName`) is emitted under its full path name, which
                    // is what a real OData service returns for a grouped nav property.
                    for (const field of transform.fields) {
                        out[field] = read(bucket[0]!, field) ?? null
                    }
                    // then the aggregates over that bucket
                    for (const spec of transform.aggregates) {
                        out[spec.alias] = computeAggregate(bucket, spec, read)
                    }

                    return out
                })
                break
            }
        }
    }

    return current
}
