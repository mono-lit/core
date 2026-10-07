import { describe, expect, it } from 'vitest'

import { applyTransforms, parseApply } from '../pkg/mock-db/apply'
import { executeQuery, parseFilter, evaluateFilter, parseQuery, toODataEnvelope } from '../pkg/mock-db/odata'

const compileFilter = (expression: string) => {
    const ast = parseFilter(expression)
    return (row: Record<string, any>) => evaluateFilter(ast, row)
}

const sales = [
    { Id: 1, Category: 'A', Region: 'North', Price: 100 },
    { Id: 2, Category: 'A', Region: 'South', Price: 200 },
    { Id: 3, Category: 'B', Region: 'North', Price: 5 },
    { Id: 4, Category: 'B', Region: 'North', Price: 300 },
    { Id: 5, Category: 'C', Region: 'South', Price: 50 },
]

const run = (apply: string, rows = sales) => applyTransforms(rows, parseApply(apply), compileFilter)

describe('$apply — parsing', () => {
    it('parses a groupby with an aggregate', () => {
        expect(parseApply('groupby((Category),aggregate(Price with sum as Total))')).toEqual([
            {
                kind: 'groupby',
                fields: ['Category'],
                aggregates: [{ field: 'Price', method: 'sum', alias: 'Total' }],
            },
        ])
    })

    it('parses a pipeline of segments, splitting only at depth 0', () => {
        // the `/` inside groupby(...) must NOT split the pipeline
        const transforms = parseApply('filter(Price gt 10)/groupby((Category),aggregate(Price with sum as Total))')
        expect(transforms.map((t) => t.kind)).toEqual(['filter', 'groupby'])
    })

    it('parses multiple grouped properties and multiple aggregates', () => {
        const [transform] = parseApply(
            'groupby((Category,Region),aggregate(Price with sum as Total,Price with max as Peak))',
        ) as any[]
        expect(transform.fields).toEqual(['Category', 'Region'])
        expect(transform.aggregates.map((a: any) => a.alias)).toEqual(['Total', 'Peak'])
    })

    it('parses `$count as Alias`', () => {
        const [transform] = parseApply('groupby((Category),aggregate($count as Rows))') as any[]
        expect(transform.aggregates[0]).toEqual({ method: 'count', alias: 'Rows' })
    })

    it('rejects an unsupported transformation instead of ignoring it', () => {
        // silently ignoring `compute(...)` would return unaggregated rows that look fine
        expect(() => parseApply('compute(Price mul 2 as Double)')).toThrow(/unsupported transformation/i)
    })

    it('rejects an unknown aggregate method', () => {
        expect(() => parseApply('aggregate(Price with median as M)')).toThrow(/unsupported aggregate method/i)
    })

    it('rejects a groupby with no parenthesised property list', () => {
        expect(() => parseApply('groupby(Category)')).toThrow(/parenthesised property list/i)
    })
})

describe('$apply — evaluation', () => {
    it('groups and sums', () => {
        expect(run('groupby((Category),aggregate(Price with sum as Total))')).toEqual([
            { Category: 'A', Total: 300 },
            { Category: 'B', Total: 305 },
            { Category: 'C', Total: 50 },
        ])
    })

    it('runs filter() BEFORE the grouping', () => {
        // Price gt 10 drops row 3 (Price 5), so B totals 300 rather than 305.
        // If the filter ran after grouping, B would still be 305 — the classic
        // "right aggregate over the wrong set" bug.
        expect(run('filter(Price gt 10)/groupby((Category),aggregate(Price with sum as Total))')).toEqual([
            { Category: 'A', Total: 300 },
            { Category: 'B', Total: 300 },
            { Category: 'C', Total: 50 },
        ])
    })

    it('groups by several properties', () => {
        expect(run('groupby((Category,Region),aggregate($count as Rows))')).toEqual([
            { Category: 'A', Region: 'North', Rows: 1 },
            { Category: 'A', Region: 'South', Rows: 1 },
            { Category: 'B', Region: 'North', Rows: 2 },
            { Category: 'C', Region: 'South', Rows: 1 },
        ])
    })

    it('supports sum / average / min / max / count / countdistinct', () => {
        const [row] = run(
            'aggregate(Price with sum as S,Price with average as A,Price with min as Mn,' +
            'Price with max as Mx,$count as C,Category with countdistinct as D)',
        ) as any[]

        expect(row).toEqual({ S: 655, A: 131, Mn: 5, Mx: 300, C: 5, D: 3 })
    })

    it('collapses to exactly one row for a bare aggregate', () => {
        expect(run('aggregate($count as Rows)')).toEqual([{ Rows: 5 }])
    })

    it('returns null (not 0) for min/max/average over an empty set', () => {
        // 0 would read as a real measurement
        expect(run('filter(Price gt 9999)/aggregate(Price with max as Mx,Price with sum as S)')).toEqual([
            { Mx: null, S: 0 },
        ])
    })

    it('groupby with no aggregate yields the distinct property combinations', () => {
        expect(run('groupby((Category))')).toEqual([
            { Category: 'A' },
            { Category: 'B' },
            { Category: 'C' },
        ])
    })
})

describe('$apply — interaction with the top-level query options', () => {
    it('applies the top-level $filter AFTER the aggregation', () => {
        // `$filter=Total gt 200` filters the GROUPS, not the source rows
        const result = executeQuery(sales, {
            apply: 'groupby((Category),aggregate(Price with sum as Total))',
            filter: 'Total gt 200',
        })
        expect(result.rows).toEqual([
            { Category: 'A', Total: 300 },
            { Category: 'B', Total: 305 },
        ])
    })

    it('counts GROUPS, not source rows', () => {
        const result = executeQuery(sales, {
            apply: 'groupby((Category),aggregate(Price with sum as Total))',
            count: true,
        })
        // 5 source rows collapse to 3 groups
        expect(result.total).toBe(3)
        expect(toODataEnvelope(result, true)['@odata.count']).toBe(3)
    })

    it('orders and pages the aggregated rows', () => {
        const result = executeQuery(sales, {
            apply: 'groupby((Category),aggregate(Price with sum as Total))',
            orderby: [{ field: 'Total', desc: true }],
            top: 2,
        })
        expect(result.rows).toEqual([
            { Category: 'B', Total: 305 },
            { Category: 'A', Total: 300 },
        ])
        expect(result.total).toBe(3) // pre-paging group count
    })

    it('parseQuery reads $apply off the query string', () => {
        const query = parseQuery('$apply=groupby((Category))&$count=true')
        expect(query.apply).toBe('groupby((Category))')
        expect(query.count).toBe(true)
    })
})
