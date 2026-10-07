// The in-memory filter evaluator behind `createStaticDatasource`. It answers the SAME
// loadOptions a remote ODataStore would, so anything it silently drops looks like data
// that simply isn't there — no error, no warning.
//
// The shapes below are not hypothetical: DevExtreme builds them itself. A multi-select
// dxTagBox resolves its selected keys back to rows through `store.load({ filter })`
// (List selection -> _loadSelectedItemsCore -> _loadFilteredData, and TagBox's own
// _getFilteredItems) whenever those rows are not in the currently loaded page — which
// is exactly what a search does. SelectionFilterCreator.getExpr() emits that filter
// FLAT and n-ary: `[c1,'or',c2,'or',c3]`.

import { describe, expect, it } from 'vitest'

import { createStaticDatasource } from '../src/core/composables/use-static-datasource'

/* ------------------------------- test harness ------------------------------ */

// The module only ever calls `new source.CustomStore(cfg)` / `new source.DataSource(cfg)`
// and reads `dataSource.store()`, so these two stand in for DevExtreme entirely — the
// tests exercise the real load path without pulling the widget library into node.
class FakeCustomStore {
    constructor(public cfg: any) {}
    load(loadOptions: any) { return this.cfg.load(loadOptions) }
    byKey(key: any) { return this.cfg.byKey(key) }
}

class FakeDataSource {
    constructor(public cfg: any) {}
    store() { return this.cfg.store }
}

const rows = [
    { CoaKode: '710101-011', CoaNama: 'Gaji', _Total: 10 },
    { CoaKode: '710101-022', CoaNama: 'Lembur', _Total: 0 },
    { CoaKode: '710101-033', CoaNama: 'Transport', _Total: 5 },
    { CoaKode: '710101-044', CoaNama: 'Konsumsi', _Total: 7 },
    { CoaKode: '710101-055', CoaNama: 'Perjalanan', _Total: 3 },
]

const [A, B, C, D, E] = rows.map((r) => r.CoaKode)

/** One condition, the way SelectionFilterCreator writes it. */
const c = (kode: string) => ['CoaKode', '=', kode]

/** `[c1,'or',c2,'or',c3]` — SelectionFilterCreator.getExpr for N selected keys. */
const anyOf = (...kodes: string[]) =>
    kodes.length === 1
        ? c(kodes[0])
        : kodes.map(c).reduce((acc: any[], cond) => (acc.length ? [...acc, 'or', cond] : [cond]), [])

const match = async (filter: any) => {
    const { dataSource } = await createStaticDatasource<any>({
        data: rows,
        key: 'CoaKode',
        source: { DataSource: FakeDataSource as any, CustomStore: FakeCustomStore as any },
    })
    const loaded = await (dataSource as any).store().load({ filter })
    return (loaded as any[]).map((r) => r.CoaKode)
}

/* --------------------- the selected-keys lookup (the bug) ------------------- */

describe('store.load({ filter }) — n-ary groups from SelectionFilterCreator', () => {
    it('resolves a single selected value', async () => {
        expect(await match(anyOf(A))).toEqual([A])
    })

    it('resolves two selected values', async () => {
        expect(await match(anyOf(A, B))).toEqual([A, B])
    })

    // The regression. The old evaluator read only `f[0] <op> f[2]` and threw away every
    // term from the 4th element on, so the THIRD pick came back unresolved and the
    // TagBox reverted its checkbox — "found, but it won't stay checked".
    it('resolves three selected values', async () => {
        expect(await match(anyOf(A, B, C))).toEqual([A, B, C])
    })

    it('resolves five selected values', async () => {
        expect(await match(anyOf(A, B, C, D, E))).toEqual([A, B, C, D, E])
    })
})

/* ----------------------------- grouping semantics -------------------------- */

describe('store.load({ filter }) — group shapes', () => {
    it('applies every term of an n-ary AND (the picker exclusion list)', async () => {
        // applyCoaOptExclusion: each list hides the other side's picks + already-added COAs
        const filter = [['CoaKode', '<>', A], 'and', ['CoaKode', '<>', B], 'and', ['CoaKode', '<>', C]]
        expect(await match(filter)).toEqual([D, E])
    })

    it('still handles the left-nested AND already in use', async () => {
        // Sumber COA: the selected-keys filter AND `_Total > 0` (a COA with nothing to give
        // cannot be a source)
        expect(await match([anyOf(A, B), 'and', ['_Total', '>', 0]])).toEqual([A])
    })

    it("binds 'and' tighter than 'or'", async () => {
        // A or (B and _Total > 4) — B has _Total 0, so only A survives
        expect(await match([c(A), 'or', c(B), 'and', ['_Total', '>', 4]])).toEqual([A])
    })

    it("treats an omitted operator as 'and'", async () => {
        expect(await match([['CoaKode', '<>', A], ['_Total', '>', 4]])).toEqual([C, D])
    })

    it('unwraps a single-element group', async () => {
        // `[['CoaKode','=',x]]` — previously misread as a condition whose field was an array
        expect(await match([c(D)])).toEqual([D])
    })

    it('negates', async () => {
        expect(await match(['!', c(A)])).toEqual([B, C, D, E])
    })
})

/* ------------------------------ plain conditions --------------------------- */

describe('store.load({ filter }) — conditions', () => {
    it('reads the [field, value] shorthand as equality', async () => {
        // read literally this is op=<value>, val=undefined -> matched everything
        expect(await match(['CoaKode', E])).toEqual([E])
    })

    it('compares numerically', async () => {
        expect(await match(['_Total', '>', 0])).toEqual([A, C, D, E])
    })

    it('does not numeric-coerce a code that only looks numeric', async () => {
        // CoaKode '710101-011' must not collapse onto a number
        expect(await match(c('710101-011'))).toEqual([A])
        expect(await match(c('710101'))).toEqual([])
    })

    it('matches text case-insensitively by default', async () => {
        expect(await match(['CoaNama', 'contains', 'transp'])).toEqual([C])
    })
})
