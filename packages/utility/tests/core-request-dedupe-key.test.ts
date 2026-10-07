// @vitest-environment jsdom

// The in-flight request dedupe behind every DataSource this package builds
// (`createRequestManager` -> `patchDxStore`). It is a SHARED, module-level map: two
// stores anywhere in the app collide as soon as they compute the same key, and the
// loser of the race is handed the winner's promise — so a key that is missing part
// of the request does not merely miss an optimization, it serves one query's rows to
// a different query, with nothing on the wire and nothing in the console.
//
// Both cases below shipped:
//   * `params` were absent from the key. Two option lists over one endpoint,
//     `$apply=groupby((PostBudget/ParentName))` and `groupby((PostBudget/Nama))`,
//     deduped into one request; the second select rendered buckets that had no such
//     field and came up empty.
//   * `stable()` was shallow, so nested loadOptions collapsed: `sort: [{selector:'A'}]`
//     and `sort: [{selector:'B'}]` both serialized to `{"sort":[{}]}`.

import { beforeEach, describe, expect, it } from 'vitest'

import { useFetchOData } from '../src/core/composables/use-fetch-helper'

/* ------------------------------- test harness ------------------------------ */

type Recorded = { url: string; params: Record<string, any>; loadOptions: any }

const loads: Recorded[] = []

/**
 * Stands in for DevExtreme's ODataStore. It reproduces the one behaviour that
 * matters here: `params` are NOT part of the url the store is constructed with —
 * they are attached per-request, in `beforeSend`.
 */
class FakeODataStore {
    constructor(public cfg: any) {}

    load(loadOptions: any) {
        const req: any = { url: this.cfg.url, params: {}, headers: {} }
        this.cfg.beforeSend?.(req)
        loads.push({ url: req.url, params: { ...req.params }, loadOptions })

        const answer = [{ query: String(req.params.$apply ?? ''), loadOptions }]
        return new Promise((resolve) => setTimeout(() => resolve(answer), 5))
    }

    byKey() {
        return Promise.resolve(null)
    }
}

class FakeCustomStore {
    constructor(public cfg: any) {}
    load(loadOptions: any) { return this.cfg.load(loadOptions) }
    byKey(key: any) { return this.cfg.byKey(key) }
}

class FakeDataSource {
    constructor(public cfg: any) {}
    store() { return this.cfg.store }
    load(loadOptions?: any) { return this.cfg.store.load(loadOptions ?? {}) }
}

const source = {
    DataSource: FakeDataSource,
    ODataStore: FakeODataStore,
    CustomStore: FakeCustomStore,
} as any

const build = async (over: Record<string, any> = {}) => {
    const { dataSource } = await useFetchOData<any>({
        url: '/DTO_BudgetAlokasiList',
        baseUrl: 'https://api.test/odata',
        type: 'datasource',
        source,
        options: {},
        ...over,
    } as any)

    return dataSource as any
}

const APPLY_PARENT = 'groupby((PostBudget/ParentName),aggregate($count as Count))'
const APPLY_NAMA = 'groupby((PostBudget/Nama),aggregate($count as Count))'

beforeEach(() => {
    loads.length = 0
    // `useFetchOData` reads `window.helper` for notifications before anything else.
    ;(window as any).helper = { notif: () => {} }
})

/* ----------------------------------- tests --------------------------------- */

describe('in-flight dedupe key', () => {
    it('does not merge two concurrent loads that differ only by `params`', async () => {
        const parent = await build({ params: { $apply: APPLY_PARENT } })
        const nama = await build({ params: { $apply: APPLY_NAMA } })

        // Concurrent on purpose — the dedupe window is in-flight only, and this is
        // exactly how the two option sources of one filter are loaded.
        const [a, b] = await Promise.all([parent.load(), nama.load()])

        expect(loads).toHaveLength(2)
        expect(loads.map((l) => l.params.$apply).sort()).toEqual([APPLY_NAMA, APPLY_PARENT].sort())

        // The decisive assertion: each caller got ITS OWN answer.
        expect(a[0].query).toBe(APPLY_PARENT)
        expect(b[0].query).toBe(APPLY_NAMA)
    })

    it('still shares one request when the requests really are identical', async () => {
        const one = await build({ params: { $apply: APPLY_PARENT } })
        const two = await build({ params: { $apply: APPLY_PARENT } })

        const [a, b] = await Promise.all([one.load(), two.load()])

        expect(loads).toHaveLength(1)
        expect(a).toBe(b)
    })

    it('keys `params` by value, not by key order', async () => {
        const one = await build({ params: { $apply: APPLY_PARENT, $count: 'true' } })
        const two = await build({ params: { $count: 'true', $apply: APPLY_PARENT } })

        await Promise.all([one.load(), two.load()])

        expect(loads).toHaveLength(1)
    })

    it('does not merge loadOptions that differ only inside a nested object', async () => {
        const ds = await build({ params: { $apply: APPLY_PARENT } })

        const [a, b] = await Promise.all([
            ds.load({ sort: [{ selector: 'Nama', desc: false }] }),
            ds.load({ sort: [{ selector: 'Kode', desc: false }] }),
        ])

        expect(loads).toHaveLength(2)
        expect(a).not.toBe(b)
    })

    it('never shares between stores carrying a caller `override`', async () => {
        // `override.dataSource` is spread into the store config and can rewrite the
        // url, the params or `beforeSend` — none of it comparable by value.
        const one = await build({ params: { $apply: APPLY_PARENT }, override: { dataSource: {} } })
        const two = await build({ params: { $apply: APPLY_PARENT }, override: { dataSource: {} } })

        await Promise.all([one.load(), two.load()])

        expect(loads).toHaveLength(2)
    })
})
