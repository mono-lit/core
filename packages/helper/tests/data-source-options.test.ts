// The universal base-query options — `dataSourceOptions` / `odataOptions` —
// and the pure helpers every controller resolves them through.
//
// These are shared by the grid (and the dropdown through it) and the chart, so
// their meaning is pinned here once, on the pure functions, rather than
// re-derived per controller. The controller-level behaviour (what each one DOES
// with the merged result) lives in the perf specs.

import { describe, it, expect } from 'vitest'
import {
  mergeDataSourceOptions,
  normalizeOdataOptions,
  parseOdataFilter,
  parseOrderby,
  resolveDataSourceOptions,
  toList,
} from '../src/utils/data-source-options'
import { buildChartOdataRequest } from '../src/components/chart/chart-odata'
import { arrayToODataString } from '../src/components/filter/filter-odata'

describe('odataOptions → dataSourceOptions', () => {
  it('maps $select / $expand / $orderby / $filter and sends every other key as a custom param', () => {
    const out = normalizeOdataOptions({
      $select: 'Id, Name',
      $expand: 'Dept',
      $orderby: 'Name desc, Id',
      $filter: "Status eq 'A' and Year ge 2024",
      $count: true,
      foo: 1,
    })
    expect(out.select).toEqual(['Id', 'Name'])
    expect(out.expand).toBe('Dept')
    expect(out.sort).toEqual([{ selector: 'Name', desc: true }, { selector: 'Id', desc: false }])
    // Symbol ops — devextreme's compiler throws E4003 on the keywords the parser emits.
    expect(out.filter).toEqual([['Status', '=', 'A'], 'and', ['Year', '>=', 2024]])
    expect(out.customQueryParams).toEqual({ $count: true, foo: 1 })
  })

  it('a $filter the parser cannot read falls back to the raw one-element form, without throwing', () => {
    expect(parseOdataFilter('Detail/any(d: d/X eq 1)')).toEqual(['(Detail/any(d: d/X eq 1))'])
    expect(parseOdataFilter('  ')).toBeNull()
  })

  it('the raw form round-trips to an OData string parenthesised — it used to be dropped as an unknown joiner', () => {
    expect(arrayToODataString(['A eq 1 and B eq 2'])).toBe('(A eq 1 and B eq 2)')
    expect(arrayToODataString([['A eq 1 and B eq 2'], 'and', ['C', '=', 3]])).toBe('(A eq 1 and B eq 2) and C eq 3')
  })

  it('parseOrderby / toList are forgiving about whitespace', () => {
    expect(parseOrderby(' A desc ,B ')).toEqual([{ selector: 'A', desc: true }, { selector: 'B', desc: false }])
    expect(toList(' a, b ,,c')).toEqual(['a', 'b', 'c'])
    expect(toList(null)).toBeUndefined()
  })
})

describe('mergeDataSourceOptions', () => {
  it('ANDs filters, unions select/expand, de-duplicates sort with a leading, merges params with b winning', () => {
    const out = mergeDataSourceOptions(
      { filter: ['A', '=', 1], select: ['Id'], expand: ['Dept'], sort: 'Code', customQueryParams: { a: 1, b: 1 }, pageSize: 10 },
      { filter: ['B', '=', 2], select: 'Name,Id', expand: 'Owner', sort: [{ selector: 'Code', desc: true }, 'Name'], customQueryParams: { b: 2 }, pageSize: 25 },
    )
    expect(out.filter).toEqual([['A', '=', 1], 'and', ['B', '=', 2]])
    expect(out.select).toEqual(['Id', 'Name'])
    expect(out.expand).toEqual(['Dept', 'Owner'])
    expect(out.sort).toEqual([{ selector: 'Code', desc: false }, { selector: 'Name', desc: false }])
    expect(out.customQueryParams).toEqual({ a: 1, b: 2 })
    expect(out.pageSize).toBe(25)
  })

  it('a nested $expand string is never split on its commas', () => {
    const out = mergeDataSourceOptions({ expand: ['Dept'] }, { expand: 'Owner($select=Id,Name)' })
    expect(out.expand).toBe('Owner($select=Id,Name)')
  })

  it('a lone filter passes through by reference', () => {
    const f = ['A', '=', 1]
    expect(mergeDataSourceOptions({ filter: f }, {}).filter).toBe(f)
    expect(mergeDataSourceOptions({}, { filter: f }).filter).toBe(f)
  })

  it('resolveDataSourceOptions reads a getter and a { value } box fresh', () => {
    const state = { s: 'A' }
    const box = { value: { $select: 'Id' } }
    const r1 = resolveDataSourceOptions(() => ({ filter: ['S', '=', state.s] }), box)
    state.s = 'B'
    box.value = { $select: 'Name' }
    const r2 = resolveDataSourceOptions(() => ({ filter: ['S', '=', state.s] }), box)
    expect(r1.filter).toEqual(['S', '=', 'A'])
    expect(r1.select).toEqual(['Id'])
    expect(r2.filter).toEqual(['S', '=', 'B'])
    expect(r2.select).toEqual(['Name'])
  })
})

describe('buildChartOdataRequest', () => {
  const series = [{ field: 'Total', agg: 'sum' as const }]

  it('plain path: the base filter is AND-ed under odata.options.filter, select/expand become load options, custom keys become params', () => {
    const r = buildChartOdataRequest({
      options: { filter: ['Year', '=', 2024], select: ['Id'] },
      base: { filter: ['Dept', '=', 'A'], select: ['Total'], expand: 'Dept', customQueryParams: { $count: true } },
      series,
    })
    expect(r.aggregated).toBe(false)
    expect(r.options.filter).toEqual([['Year', '=', 2024], 'and', ['Dept', '=', 'A']])
    expect(r.options.select).toEqual(['Id', 'Total'])
    expect(r.options.expand).toEqual(['Dept'])
    expect(r.options.paginate).toBeUndefined()
    expect(r.params).toEqual({ $count: true })
  })

  it('$apply path: the composed filter is folded INSIDE the clause, removed as a sibling, paginate forced off', () => {
    const r = buildChartOdataRequest({
      options: { filter: ['Year', '=', 2024] },
      base: { filter: ["DeptKode eq 'MKT'"] }, // the raw string form a store scopes with
      aggregate: ({ apply, filter, withFilter }) => withFilter(apply, filter),
      groupBy: 'Gender',
      series,
    })
    expect(r.aggregated).toBe(true)
    expect(r.params.$apply).toBe("filter(Year eq 2024 and (DeptKode eq 'MKT'))/groupby((Gender),aggregate(Total with sum as Total))")
    expect(r.options.filter).toBeUndefined()
    expect(r.options.paginate).toBe(false)
  })

  it('$apply without a groupBy is refused', () => {
    expect(() =>
      buildChartOdataRequest({ aggregate: ({ apply }) => apply, series }),
    ).toThrow(/groupBy/)
  })

  it('control: no base and no aggregate leaves odata.options untouched', () => {
    const r = buildChartOdataRequest({ options: { filter: ['A', '=', 1], take: 5 }, series })
    expect(r.options).toEqual({ filter: ['A', '=', 1], take: 5 })
    expect(r.params).toEqual({})
  })
})
