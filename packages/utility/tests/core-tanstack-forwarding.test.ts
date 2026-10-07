// @vitest-environment jsdom

// `useFetchOData({ tanstack })` forwards the opt-in TanStack options ONLY to store classes that
// declare support through the neutral `Symbol.for('mono.tanstack')` flag. Plain DevExtreme stores
// never receive the key, so the option is a silent no-op for them.

import { describe, expect, it } from 'vitest'

import { useFetchOData } from '../src/core/composables/use-fetch-helper'

const FLAG = Symbol.for('mono.tanstack')

function makeSource(supported: boolean) {
    const created: { ods: any[]; cs: any[] } = { ods: [], cs: [] }
    class FakeODataStore {
        constructor(public cfg: any) { created.ods.push(cfg) }
        load() { return Promise.resolve([]) }
        byKey() { return Promise.resolve(null) }
    }
    class FakeCustomStore {
        constructor(public cfg: any) { created.cs.push(cfg) }
        load(o: any) { return this.cfg.load?.(o) ?? Promise.resolve([]) }
        byKey(k: any) { return this.cfg.byKey?.(k) ?? Promise.resolve(null) }
    }
    class FakeDataSource {
        constructor(public cfg: any) {}
        store() { return this.cfg.store }
        load() { return Promise.resolve([]) }
    }
    if (supported) {
        ;(FakeODataStore as any)[FLAG] = true
        ;(FakeCustomStore as any)[FLAG] = true
    }
    return { source: { DataSource: FakeDataSource, ODataStore: FakeODataStore, CustomStore: FakeCustomStore } as any, created }
}

const tanstack = { retry: 3, networkMode: 'online' as const, staleTime: 30_000 }

const build = (source: any, over: Record<string, any> = {}) => useFetchOData<any>({
    url: '/Items',
    baseUrl: 'https://api.test/odata',
    type: 'datasource',
    source,
    options: {},
    tanstack,
    ...over,
} as any)

describe('useFetchOData: tanstack forwarding', () => {
    it('reaches the ODataStore of a flagged data layer', async () => {
        const { source, created } = makeSource(true)
        await build(source)
        expect(created.ods).toHaveLength(1)
        expect(created.ods[0].tanstack).toEqual(tanstack)
    })

    it('is dropped for plain DevExtreme stores (no flag) — a silent no-op', async () => {
        const { source, created } = makeSource(false)
        await build(source)
        expect(created.ods).toHaveLength(1)
        expect('tanstack' in created.ods[0]).toBe(false)
    })

    it('is absent when not requested, even for a flagged data layer', async () => {
        const { source, created } = makeSource(true)
        await build(source, { tanstack: undefined })
        expect('tanstack' in created.ods[0]).toBe(false)
    })

    it('an explicit override.dataSource.tanstack still wins', async () => {
        const { source, created } = makeSource(true)
        await build(source, { override: { dataSource: { tanstack: { retry: false } } } })
        expect(created.ods[0].tanstack).toEqual({ retry: false })
    })

    it('reaches the fake-datasource CustomStore of a flagged data layer', async () => {
        const { source, created } = makeSource(true)
        await build(source, { type: 'fakedatasource', method: 'POST' })
        expect(created.cs).toHaveLength(1)
        expect(created.cs[0].tanstack).toEqual(tanstack)
    })
})
