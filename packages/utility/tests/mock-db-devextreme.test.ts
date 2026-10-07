// The DevExtreme bridge. A grid pushes filtering/sorting/paging to the SERVER via
// `loadOptions`; if the translation drops them the grid silently renders unfiltered,
// unsorted, unpaged rows that LOOK correct. This is the least-covered code in the
// feature and the one that drives real widgets, so pin it down.

import { describe, expect, it } from 'vitest'

import { groupRows, groupSelectors, loadOptionsToQuery } from '../pkg/mock-db/devextreme'

describe('loadOptionsToQuery', () => {
    it('passes $expand through (the path a grid uses for relations)', () => {
        expect(loadOptionsToQuery({ expand: ['user', 'cars'] }).expand).toEqual([
            { name: 'user' },
            { name: 'cars' },
        ])
    })

    it('parses NESTED expand options coming from the core `options.expand`', () => {
        // the real shape from esw-project: a string carrying $select/$expand/$filter/$top
        const query = loadOptionsToQuery({
            expand: ["Approval($select=Id;$expand=StepApproval($select=ActionType);$filter=Status eq 'Menunggu';$top=1)"],
        })

        expect(query.expand).toEqual([
            {
                name: 'Approval',
                select: ['Id'],
                filter: "Status eq 'Menunggu'",
                top: 1,
                expand: [{ name: 'StepApproval', select: ['ActionType'] }],
            },
        ])
    })

    it('translates sort into orderby, both shapes', () => {
        expect(loadOptionsToQuery({ sort: [{ selector: 'Name', desc: true }] }).orderby).toEqual([
            { field: 'Name', desc: true },
        ])
        // a bare string selector is legal too
        expect(loadOptionsToQuery({ sort: 'Name' }).orderby).toEqual([{ field: 'Name', desc: false }])
    })

    it('translates skip/take into skip/top', () => {
        expect(loadOptionsToQuery({ skip: 20, take: 10 })).toMatchObject({ skip: 20, top: 10 })
    })

    it('asks for the total count when the grid needs a pager', () => {
        expect(loadOptionsToQuery({ requireTotalCount: true }).count).toBe(true)
        expect(loadOptionsToQuery({}).count).toBeUndefined()
    })

    it('translates a binary filter into $filter', () => {
        expect(loadOptionsToQuery({ filter: ['Id', '=', 1] }).filter).toBe('Id eq 1')
        expect(loadOptionsToQuery({ filter: ['Name', 'contains', 'ab'] }).filter).toBe("contains(Name,'ab')")
        expect(loadOptionsToQuery({ filter: ['Age', '>=', 18] }).filter).toBe('Age ge 18')
        expect(loadOptionsToQuery({ filter: ['Name', '<>', 'x'] }).filter).toBe("Name ne 'x'")
    })

    it('translates a grouped filter, preserving the and/or operator', () => {
        const query = loadOptionsToQuery({
            filter: [['Id', '=', 1], 'or', ['Id', '=', 2]],
        })
        expect(query.filter).toBe('(Id eq 1) or (Id eq 2)')
    })

    it('translates a negated filter', () => {
        expect(loadOptionsToQuery({ filter: ['!', ['Id', '=', 1]] }).filter).toBe('not (Id eq 1)')
    })

    it('escapes a quote in a string literal so the filter still parses', () => {
        // O'Brien would otherwise terminate the literal early and throw
        expect(loadOptionsToQuery({ filter: ['Name', '=', "O'Brien"] }).filter).toBe("Name eq 'O''Brien'")
    })

    it('leaves an empty filter undefined rather than emitting nonsense', () => {
        expect(loadOptionsToQuery({ filter: [] }).filter).toBeUndefined()
        expect(loadOptionsToQuery({}).filter).toBeUndefined()
    })

    it('passes a raw OData string through untouched (calculateFilterExpression)', () => {
        // DevExtreme's escape hatch for what its own filter syntax cannot express:
        //   calculateFilterExpression: () => [`KurangBudgetDetail/any(d: d/Bulan eq 3)`]
        // Destructured as [field, operator, value] this used to emit
        // `KurangBudgetDetail/any(...) eq ''` — nonsense that then failed to parse.
        const raw = 'KurangBudgetDetail/any(d: d/Bulan eq 3)'
        expect(loadOptionsToQuery({ filter: [raw] }).filter).toBe(raw)
    })

    it('still treats a real [field, op, value] triple as a triple', () => {
        // the passthrough must not swallow the normal case
        expect(loadOptionsToQuery({ filter: ['Id', '=', 1] }).filter).toBe('Id eq 1')
    })
})

describe('core `options` (DataSourceOptions) mapping', () => {
    it('maps pageSize to $top when the caller did not send take', () => {
        // The core's `options` pages with paginate/pageSize, not the take/skip a grid sends.
        // Ignoring it made a paged fetch return the whole table.
        expect(loadOptionsToQuery({ paginate: true, pageSize: 10 }).top).toBe(10)
    })

    it('lets a grid\'s own take win over pageSize', () => {
        expect(loadOptionsToQuery({ paginate: true, pageSize: 10, take: 3 }).top).toBe(3)
    })

    it('ignores pageSize when paging is explicitly off', () => {
        expect(loadOptionsToQuery({ paginate: false, pageSize: 10 }).top).toBeUndefined()
    })

    it('carries select/sort/filter from a core options object', () => {
        const query = loadOptionsToQuery({
            select: ['Id', 'Name'],
            sort: [{ selector: 'Id', desc: true }],
            filter: ['Id', '>', 2],
        })
        expect(query.select).toEqual(['Id', 'Name'])
        expect(query.orderby).toEqual([{ field: 'Id', desc: true }])
        expect(query.filter).toBe('Id gt 2')
    })
})

describe('grid grouping (loadOptions.group)', () => {
    const rows = [
        { Id: 1, Category: 'A', Price: 100 },
        { Id: 2, Category: 'B', Price: 200 },
        { Id: 3, Category: 'A', Price: 50 },
    ]

    it('reads group selectors in both shapes', () => {
        expect(groupSelectors([{ selector: 'Category', desc: true }])).toEqual([
            { selector: 'Category', desc: true },
        ])
        expect(groupSelectors('Category')).toEqual([{ selector: 'Category', desc: false }])
        expect(groupSelectors(undefined)).toEqual([])
    })

    it('returns DevExtreme\'s { key, items, count } shape, not a flat array', () => {
        // a flat array here makes the group panel render empty while the rows still
        // look fine — silently wrong
        const groups = groupRows(rows, [{ selector: 'Category', desc: false }])

        expect(groups).toHaveLength(2)
        expect(groups[0]).toMatchObject({ key: 'A', count: 2 })
        expect(groups[0]!.items!.map((r: any) => r.Id)).toEqual([1, 3])
        expect(groups[1]).toMatchObject({ key: 'B', count: 1 })
    })

    it('honours desc on the group key', () => {
        const groups = groupRows(rows, [{ selector: 'Category', desc: true }])
        expect(groups.map((g) => g.key)).toEqual(['B', 'A'])
    })

    it('computes group summaries', () => {
        const groups = groupRows(rows, [{ selector: 'Category', desc: false }], {
            groupSummary: [
                { selector: 'Price', summaryType: 'sum' },
                { selector: 'Price', summaryType: 'max' },
                { summaryType: 'count' },
            ],
        })
        expect(groups[0]!.summary).toEqual([150, 100, 2])
        expect(groups[1]!.summary).toEqual([200, 200, 1])
    })

    it('collapses items to null when the group is not expanded (lazy group loading)', () => {
        const groups = groupRows(rows, [{ selector: 'Category', desc: false }], { expanded: false })
        expect(groups[0]!.items).toBeNull()
        // the count must still be right, or the grid shows an empty group
        expect(groups[0]!.count).toBe(2)
    })

    it('nests multi-level grouping', () => {
        const nested = [
            { Id: 1, Category: 'A', Region: 'N' },
            { Id: 2, Category: 'A', Region: 'S' },
            { Id: 3, Category: 'A', Region: 'N' },
        ]
        const groups = groupRows(nested, [
            { selector: 'Category', desc: false },
            { selector: 'Region', desc: false },
        ])

        expect(groups).toHaveLength(1)
        const inner = groups[0]!.items as any[]
        expect(inner.map((g) => g.key)).toEqual(['N', 'S'])
        expect(inner[0].count).toBe(2)
    })
})
