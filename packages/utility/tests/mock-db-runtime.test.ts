// The async round-trip: real IndexedDB (fake-indexeddb implements the actual
// spec, event-based and asynchronous), driven exactly the way the fetch wrapper
// drives it. Proves the mock answers over promises with no server and no port.

import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'

import { createMockDb, resetMonoMockDb } from '../pkg/mock-db'

const config = {
    dbName: 'test-mock',
    version: 1,
    seedCount: 5,
    seedRandom: 1,
    schema: {
        'my-mock': {
            users: {
                fields: {
                    id: 'number|primary',
                    name: 'string',
                    age: 'number',
                    cars: 'array|id->cars:userId',
                },
            },
            cars: {
                fields: {
                    id: 'number|primary',
                    userId: 'number|foreign',
                    model: 'string',
                    user: 'object|userId->users:id',
                },
            },
        },
    },
}

let version = 1
const freshDb = () => {
    resetMonoMockDb()
    // a new db name per test so one test's writes can't leak into the next
    return createMockDb({ ...config, dbName: `test-mock-${version++}` } as any)
}

describe('mock runtime — asynchronous, no server', () => {
    beforeEach(() => resetMonoMockDb())

    it('hydrates IndexedDB from the generated seed and answers a GET', async () => {
        const db = freshDb()

        const response = await db.request({ url: '/my-mock/users', method: 'GET' })

        expect(response.statusCode).toBe(200)
        expect(response.data.value).toHaveLength(5)
        expect(response.data.value[0]).toMatchObject({ id: 1 })
    })

    it('runs $filter/$orderby/$top through the engine', async () => {
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/users',
            method: 'GET',
            params: { $filter: 'id gt 2', $orderby: 'id desc', $top: 2, $count: 'true' },
        })

        expect(response.data.value.map((row: any) => row.id)).toEqual([5, 4])
        // count is the FILTERED total (3), not the page size (2) nor the table (5)
        expect(response.data['@odata.count']).toBe(3)
    })

    it('$expand joins the related table (array: parent -> children)', async () => {
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/users',
            method: 'GET',
            params: { $expand: 'cars', $top: 1 },
        })

        const user = response.data.value[0]
        expect(Array.isArray(user.cars)).toBe(true)
        // the generator points every FK at a real parent, so this must be non-empty
        expect(user.cars.length).toBeGreaterThan(0)
        expect(user.cars[0].userId).toBe(user.id)
    })

    it('$expand joins the related table (object: child -> parent)', async () => {
        // the direction that was only ever covered by the pure engine, never through
        // real IndexedDB — so nothing proved index.ts preloads the parent table
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/cars',
            method: 'GET',
            params: { $expand: 'user', $top: 3 },
        })

        for (const car of response.data.value) {
            expect(car.user).not.toBeNull()
            expect(Array.isArray(car.user)).toBe(false)
            expect(car.user.id).toBe(car.userId)
        }
    })

    it('an expanded relation is never persisted back into the store', async () => {
        const db = freshDb()

        await db.request({ url: '/my-mock/cars', method: 'GET', params: { $expand: 'user' } })

        // relations are virtual: expanding must not write `user` into the row
        const dump = await db.export()
        expect(dump['my-mock']!.cars[0]).not.toHaveProperty('user')
    })

    it('POST persists — and the row is still there on the next read', async () => {
        const db = freshDb()

        const created = await db.request({
            url: '/my-mock/users',
            method: 'POST',
            payload: { name: 'Persisted', age: 99 },
        })

        expect(created.statusCode).toBe(201)
        expect(created.data.id).toBe(6) // key auto-assigned from max+1

        const after = await db.request({ url: '/my-mock/users', method: 'GET' })
        expect(after.data.value).toHaveLength(6)
        expect(after.data.value.find((row: any) => row.name === 'Persisted')).toBeTruthy()
    })

    it('PUT updates by key and DELETE removes', async () => {
        const db = freshDb()

        const updated = await db.request({
            url: '/my-mock/users(2)',
            method: 'PUT',
            payload: { name: 'Renamed' },
        })
        expect(updated.statusCode).toBe(200)
        expect(updated.data).toMatchObject({ id: 2, name: 'Renamed' })

        const removed = await db.request({ url: '/my-mock/users(2)', method: 'DELETE' })
        expect(removed.statusCode).toBe(200)

        const after = await db.request({ url: '/my-mock/users', method: 'GET' })
        expect(after.data.value.map((row: any) => row.id)).not.toContain(2)
    })

    it('GET by key returns the single row, and 404s when it is gone', async () => {
        const db = freshDb()

        expect((await db.request({ url: '/my-mock/users(3)' })).data).toMatchObject({ id: 3 })
        expect((await db.request({ url: '/my-mock/users(999)' })).statusCode).toBe(404)
    })

    it('reports a url that is not a mock route', () => {
        const db = freshDb()
        expect(db.matches('/my-mock/users')).toBe(true)
        expect(db.matches('/somewhere-else/users')).toBe(false)
    })

    it('reset() wipes and re-seeds', async () => {
        const db = freshDb()

        await db.request({ url: '/my-mock/users', method: 'POST', payload: { name: 'Temp' } })
        expect((await db.request({ url: '/my-mock/users' })).data.value).toHaveLength(6)

        await db.reset()

        const after = await db.request({ url: '/my-mock/users' })
        expect(after.data.value).toHaveLength(5)
        expect(after.data.value.find((row: any) => row.name === 'Temp')).toBeUndefined()
    })

    it('accepts a reactive/Proxy payload without DataCloneError', async () => {
        const db = freshDb()

        // IndexedDB persists via structured clone, which throws DataCloneError on a
        // Proxy — and Vue's reactive()/ref() state IS a Proxy. Apps hand store state
        // straight to a POST, so the store must flatten it first.
        const reactiveRow = new Proxy(
            { name: 'From reactive state', age: 42 },
            { get: (target, key) => (target as any)[key] },
        )

        const created = await db.request({
            url: '/my-mock/users',
            method: 'POST',
            payload: reactiveRow as any,
        })

        expect(created.statusCode).toBe(201)
        expect(created.error).toBeNull()

        const after = await db.request({ url: '/my-mock/users' })
        expect(after.data.value.find((row: any) => row.name === 'From reactive state')).toBeTruthy()
    })

    it('$apply groupby runs end-to-end through IndexedDB', async () => {
        const db = freshDb()

        // 5 generated users (ids 1..5), 5 cars each pointing at a real user
        const response = await db.request({
            url: '/my-mock/cars',
            method: 'GET',
            params: {
                $apply: 'groupby((userId),aggregate($count as Rows))',
                $count: 'true',
            },
        })

        expect(response.statusCode).toBe(200)

        const groups = response.data.value
        expect(groups).toHaveLength(5)
        expect(groups[0]).toHaveProperty('Rows')
        // @odata.count must report GROUPS (5), not the source rows
        expect(response.data['@odata.count']).toBe(groups.length)
    })

    it('a top-level $filter applies AFTER $apply, to the aggregated rows', async () => {
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/cars',
            method: 'GET',
            params: {
                $apply: 'groupby((userId),aggregate($count as Rows))',
                // each generated user owns exactly 1 car, so Rows gt 1 must match none
                $filter: 'Rows gt 1',
            },
        })

        expect(response.data.value).toEqual([])
    })

    it('an unsupported $apply transformation errors instead of returning raw rows', async () => {
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/users',
            method: 'GET',
            params: { $apply: 'compute(age mul 2 as Double)' },
        })

        // silently ignoring it would return every ungrouped row with a 200
        expect(response.statusCode).toBe(500)
        expect(response.error?.message).toMatch(/unsupported transformation/i)
    })

    it('a lambda filter resolves a virtual relation end-to-end through IndexedDB', async () => {
        const db = freshDb()

        // `cars` is a virtual relation on users — never stored, never $expand-ed here.
        // The generator gives user N exactly one car, so `any(c: c/id eq 1)` must match
        // exactly the user who owns car 1.
        const response = await db.request({
            url: '/my-mock/users',
            method: 'GET',
            params: { $filter: 'cars/any(c: c/id eq 1)' },
        })

        expect(response.statusCode).toBe(200)
        expect(response.data.value).toHaveLength(1)

        // and the row itself is untouched — the relation is not materialised by filtering
        expect(response.data.value[0]).not.toHaveProperty('cars')
    })

    it('supports `in` end-to-end', async () => {
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/users',
            method: 'GET',
            params: { $filter: 'id in (2,4)' },
        })

        expect(response.data.value.map((row: any) => row.id)).toEqual([2, 4])
    })

    it('honours a prebuilt query (the core `options` path)', async () => {
        // The core applies `options` even for type:'data' — it builds a DataSource from them
        // and .load()s it. The mock therefore has to apply them too, or a filtered call
        // returns EVERY row here while returning a filtered set in production.
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/users',
            method: 'GET',
            query: {
                filter: 'id gt 3',
                orderby: [{ field: 'id', desc: true }],
                select: ['id'],
            },
        })

        expect(response.data.value).toEqual([{ id: 5 }, { id: 4 }])
    })

    it('a prebuilt query wins over params', async () => {
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/users',
            method: 'GET',
            params: { $top: 5 },
            query: { top: 1 },
        })

        expect(response.data.value).toHaveLength(1)
    })

    it('PUT with a keyless url + payload.keyValue (the shape the core actually sends)', async () => {
        // The core does `store.update(payload.keyValue, payload.data)` with NO key in the
        // url. The mock used to read the key only from the url, so this 400'd against
        // the mock while working against a real backend.
        const db = freshDb()

        const updated = await db.request({
            url: '/my-mock/users',
            method: 'PUT',
            key: 2,
            payload: { name: 'Renamed', age: 1 },
        })

        expect(updated.statusCode).toBe(200)
        expect(updated.data).toMatchObject({ id: 2, name: 'Renamed' })
    })

    it('DELETE with a keyless url + payload.keyValue', async () => {
        const db = freshDb()

        const removed = await db.request({ url: '/my-mock/users', method: 'DELETE', key: 3 })
        expect(removed.statusCode).toBe(200)

        const after = await db.request({ url: '/my-mock/users' })
        expect(after.data.value.map((row: any) => row.id)).not.toContain(3)
    })

    it('a url key still wins over payload.keyValue', async () => {
        // the DevExtreme CustomStore builds Entity(key) urls — that path must not break
        const db = freshDb()

        const updated = await db.request({
            url: '/my-mock/users(1)',
            method: 'PATCH',
            key: 999,
            payload: { name: 'FromUrl' },
        })

        expect(updated.data).toMatchObject({ id: 1, name: 'FromUrl' })
    })

    it('PATCH merges, PUT replaces', async () => {
        const db = freshDb()

        // PATCH: `age` is not in the body, so it must survive
        const patched = await db.request({
            url: '/my-mock/users',
            method: 'PATCH',
            key: 1,
            payload: { name: 'Patched' },
        })
        expect(patched.data.name).toBe('Patched')
        expect(patched.data.age).toBeDefined()

        // PUT: a real OData PUT REPLACES the row, so the omitted `age` is gone.
        // Merging here would hide a production bug where a partial PUT nulls fields.
        const replaced = await db.request({
            url: '/my-mock/users',
            method: 'PUT',
            key: 1,
            payload: { name: 'Replaced' },
        })
        expect(replaced.data.name).toBe('Replaced')
        expect(replaced.data.age).toBeUndefined()
        // the key always survives
        expect(replaced.data.id).toBe(1)
    })

    it('POST with a JSON STRING body stores a real row (RequestInit.body)', async () => {
        // regression: `monoFetch` takes RequestInit, so body is JSON.stringify(obj).
        // The store used to spread the string character-by-character and persist
        // {"0":"{","1":"\"",...} — with a 201. Silent corruption.
        const db = freshDb()

        const created = await db.request({
            url: '/my-mock/users',
            method: 'POST',
            payload: JSON.stringify({ name: 'Ada', age: 36 }) as any,
        })

        expect(created.statusCode).toBe(201)
        expect(created.data).toMatchObject({ name: 'Ada', age: 36 })
        expect(created.data).not.toHaveProperty('0')

        const after = await db.request({ url: '/my-mock/users' })
        expect(after.data.value.find((row: any) => row.name === 'Ada')).toBeTruthy()
    })

    it('PUT with a JSON string body works too', async () => {
        const db = freshDb()

        const updated = await db.request({
            url: '/my-mock/users',
            method: 'PUT',
            key: 1,
            payload: JSON.stringify({ name: 'Str' }) as any,
        })

        expect(updated.data).toMatchObject({ id: 1, name: 'Str' })
    })

    it('an invalid JSON body is rejected, not stored', async () => {
        const db = freshDb()

        const response = await db.request({
            url: '/my-mock/users',
            method: 'POST',
            payload: '{ not json' as any,
        })

        expect(response.statusCode).toBe(400)
        expect(response.error?.message).toMatch(/not valid JSON/i)

        // and nothing was written
        const after = await db.request({ url: '/my-mock/users' })
        expect(after.data.value).toHaveLength(5)
    })

    it('a non-object body (array / FormData) is rejected with a clear message', async () => {
        const db = freshDb()

        const asArray = await db.request({
            url: '/my-mock/users',
            method: 'POST',
            payload: JSON.stringify([1, 2, 3]) as any,
        })
        expect(asArray.statusCode).toBe(400)
        expect(asArray.error?.message).toMatch(/array/i)

        // FormData has no enumerable own props — it would silently store as {}
        const asFormData = await db.request({
            url: '/my-mock/users',
            method: 'POST',
            payload: new Map([['a', 1]]) as any,
        })
        expect(asFormData.statusCode).toBe(400)
        expect(asFormData.error?.message).toMatch(/plain object/i)
    })

    it('REST-style path keys work for every verb (`/users/1`)', async () => {
        // monoFetch puts the key in the path, not in Entity(1) parens
        const db = freshDb()

        expect((await db.request({ url: '/my-mock/users/1' })).data).toMatchObject({ id: 1 })

        const put = await db.request({
            url: '/my-mock/users/1',
            method: 'PUT',
            payload: JSON.stringify({ name: 'Rest' }) as any,
        })
        expect(put.data).toMatchObject({ id: 1, name: 'Rest' })

        const patch = await db.request({
            url: '/my-mock/users/1',
            method: 'PATCH',
            payload: { age: 7 } as any,
        })
        expect(patch.data).toMatchObject({ id: 1, name: 'Rest', age: 7 })

        expect((await db.request({ url: '/my-mock/users/1', method: 'DELETE' })).statusCode).toBe(200)
        expect((await db.request({ url: '/my-mock/users/1' })).statusCode).toBe(404)
    })

    it('export() dumps every table', async () => {
        const db = freshDb()
        const dump = await db.export()

        expect(Object.keys(dump)).toEqual(['my-mock'])
        expect(dump['my-mock']!.users).toHaveLength(5)
        expect(dump['my-mock']!.cars).toHaveLength(5)
    })
})
