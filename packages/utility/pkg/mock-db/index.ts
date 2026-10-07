// pkg/mock-db/index.ts — the mock backend runtime.
//
// Ties schema + generator + OData engine + IndexedDB together and exposes the
// two things the rest of @mono-lit/utility needs:
//
//   monoMockDb()      -> lifecycle + escape hatches (reset/export/import)
//   executeMockRequest -> serve one fetch call from IndexedDB
//
// There is no server. A request never leaves the browser, which is what makes
// this work identically in dev and in a static production build, offline.

import type { MonoMockDbConfig } from '../../src/composables/create-config'
import {
    matchMockRoute,
    parseMockSchema,
    type MonoMockParsedEntity,
    type MonoMockParsedSchema,
} from './schema'
import { generateSeed } from './generate'
import {
    executeQuery,
    parseKeySegment,
    parseQuery,
    toODataEnvelope,
    type ODataQuery,
} from './odata'
import { createMockStore, isIndexedDbAvailable, openMockDb, type MonoMockStore } from './store'

const DEFAULTS = {
    dbName: 'mono-mock',
    version: 1,
    seedCount: 10,
    seedRandom: 1,
}

export interface MonoMockRequest {
    url: string
    method?: string
    /** Query string or param object — DevExtreme sends either. */
    params?: string | Record<string, any>
    /**
     * A prebuilt query, which wins over `params`.
     *
     * The fetch wrapper uses this to merge the core's `options` (the DevExtreme
     * DataSourceOptions shape: select/filter/sort/expand/take/pageSize) with any raw
     * `$`-params, since only the caller knows both.
     */
    query?: ODataQuery
    /**
     * Row key for PUT/PATCH/DELETE, when the url carries none.
     *
     * The core sends it in the payload envelope (`payload.keyValue`) and leaves the url
     * keyless — `store.update(payload.keyValue, payload.data)`. A url key still wins,
     * so the DevExtreme CustomStore's `Entity(key)` urls keep working.
     */
    key?: string | number

    /** Body for POST/PUT/PATCH. */
    payload?: Record<string, any> | null
}

export interface MonoMockResponse<T = any> {
    data: T | null
    statusCode: number
    error: { message: string; stack: string; response: any } | null
}

export interface MonoMockDb {
    /** True once the schema is parsed and IndexedDB is hydrated. */
    ready: Promise<void>
    schemas: MonoMockParsedSchema[]
    /** Does this url belong to a mock schema? */
    matches(url: string): boolean
    request<T = any>(request: MonoMockRequest): Promise<MonoMockResponse<T>>
    /** Wipe and re-hydrate from the seed. */
    reset(): Promise<void>
    /** Dump every table (for promoting generated rows into an explicit `seed`). */
    export(): Promise<Record<string, Record<string, Record<string, any>[]>>>
    /** Replace tables with the given rows. */
    import(data: Record<string, Record<string, Record<string, any>[]>>): Promise<void>
}

let instance: MonoMockDb | null = null

/**
 * Build the runtime for a config. Idempotent per page — `monoMockDb()` caches it,
 * so the schema is parsed and IndexedDB opened once.
 */
export function createMockDb(config: MonoMockDbConfig): MonoMockDb {
    const dbName = config.dbName ?? DEFAULTS.dbName
    const version = config.version ?? DEFAULTS.version
    const seedCount = config.seedCount ?? DEFAULTS.seedCount
    const seedRandom = config.seedRandom ?? DEFAULTS.seedRandom

    const { schemas, errors } = parseMockSchema(config)

    if (errors.length) {
        // Loud, not fatal: a bad relation shouldn't take the whole app down, but it
        // silently returning no rows is exactly the kind of bug that wastes an hour.
        for (const error of errors) {
            console.error(
                `[@mono-lit/utility/mock-db] schema error in "${error.baseUrl}" -> ${error.entity}` +
                `${error.field ? `.${error.field}` : ''}: ${error.message}`,
            )
        }
    }

    let store: MonoMockStore | null = null

    /**
     * Split a write payload into the row's own columns and any nested child
     * collections (an OData **deep insert**).
     *
     * The app POSTs a header with its details inline:
     *   { Nama, CompanyId, BudgetAlokasi: [ {...}, {...} ] }
     * A real OData service creates those children as rows in their OWN entity set.
     * Storing the array as a blob column instead means a later
     * `GET /DTO_BudgetAlokasi` returns nothing while production returns the children —
     * so the mock would quietly disagree with the backend.
     */
    function splitDeepInsert(entity: MonoMockParsedEntity, payload: Record<string, any>) {
        const own: Record<string, any> = {}
        const children: { relation: NonNullable<MonoMockParsedEntity['relations'][number]['relation']>; rows: Record<string, any>[] }[] = []

        for (const [key, value] of Object.entries(payload)) {
            const field = entity.relations.find(
                (candidate) => candidate.name.toLowerCase() === key.toLowerCase(),
            )

            if (field?.relation?.kind === 'array' && Array.isArray(value)) {
                children.push({ relation: field.relation, rows: value })
                continue
            }

            own[key] = value
        }

        return { own, children }
    }

    /** Insert the nested rows into their own entity set, pointing them at the parent. */
    async function writeChildren(
        schema: MonoMockParsedSchema,
        entity: MonoMockParsedEntity,
        parent: Record<string, any>,
        children: ReturnType<typeof splitDeepInsert>['children'],
    ) {
        if (!store || !children.length) return

        for (const { relation, rows } of children) {
            const target = schema.entities[relation.targetEntity]
            if (!target) continue

            // relation A->B:C means B[C] === parent[A] — so stamp the FK from the
            // parent's own value, which for a fresh POST is the key just assigned.
            const parentValue = parent[relation.localField]

            for (const child of rows) {
                await store.insert(schema.baseUrl, target.name, {
                    ...child,
                    [relation.targetKey]: parentValue,
                })
            }
        }
    }

    async function hydrate(force = false) {
        if (!isIndexedDbAvailable()) return

        const db = await openMockDb(dbName, version, schemas)
        store = createMockStore(db)

        for (const schema of schemas) {
            const seed = generateSeed(schema, { count: seedCount, random: seedRandom })

            for (const [entityName, rows] of Object.entries(seed)) {
                // Only seed an empty table: on a normal reload the user's own edits
                // must survive. `force` (reset) bypasses that.
                const existing = force ? [] : await store.read(schema.baseUrl, entityName)
                if (existing.length) continue

                await store.write(schema.baseUrl, entityName, rows)
            }
        }
    }

    const ready = hydrate().catch((error) => {
        console.error('[@mono-lit/utility/mock-db] failed to open IndexedDB:', error)
    })

    async function readEntityRows(baseUrl: string, entity: string) {
        if (!store) return []
        return store.read(baseUrl, entity)
    }

    async function request<T = any>(input: MonoMockRequest): Promise<MonoMockResponse<T>> {
        await ready

        const fail = (statusCode: number, message: string): MonoMockResponse<T> => ({
            data: null,
            statusCode,
            error: { message, stack: '', response: null },
        })

        if (!store) return fail(503, '[@mono-lit/utility/mock-db] IndexedDB is not available')

        const route = matchMockRoute(schemas, input.url)
        if (!route) return fail(404, `[@mono-lit/utility/mock-db] no mock entity for "${input.url}"`)

        const { schema, entity, rest } = route
        const method = String(input.method ?? 'GET').toUpperCase()

        // `Entity(1)` — or a trailing `/1` path segment
        const segments = rest.split('/')
        const inlineKey = parseKeySegment(segments[0] ?? '')
        const pathKey = segments[1] != null && segments[1] !== '' ? decodeURIComponent(segments[1]) : null
        const urlKey = inlineKey ?? (pathKey != null ? coerceKey(pathKey) : null)

        // url (`/flows(12)`) -> explicit key (the core's `payload.keyValue`) -> the body's own
        // primary key. Covers every call style without any of them special-casing the mock.
        // Normalise the body BEFORE resolving the key: `monoFetch` sends a JSON string
        // (RequestInit.body), and `'{"Id":1}'['Id']` is undefined — so the key fallback
        // has to read the parsed row, not the raw payload.
        const body = normalizePayload(input.payload)
        const row = body.ok ? body.row : {}

        const rawKey =
            urlKey ??
            (input.key != null ? coerceKey(String(input.key)) : null) ??
            (row[entity.primaryKey] as any) ??
            null

        try {
            if (method === 'GET') {
                const query: ODataQuery =
                    input.query ?? parseQuery(input.params ?? extractQuery(input.url))
                const rows = await readEntityRows(schema.baseUrl, entity.name)

                if (rawKey != null) {
                    const match = rows.find((row) => row[entity.primaryKey] === rawKey)
                    if (!match) return fail(404, `[@mono-lit/utility/mock-db] ${entity.name}(${rawKey}) not found`)
                    return { data: match as T, statusCode: 200, error: null }
                }

                // Sibling tables are needed by $expand AND by a lambda filter over a
                // navigation property (`Detail/any(d: ...)`) — relations are virtual, so
                // without preloading them the lambda sees an empty collection and
                // silently matches nothing. The query engine is synchronous, so they
                // must be loaded BEFORE querying, not lazily inside it.
                const needsRelations = Boolean(query.expand?.length) || Boolean(query.filter)
                const related: Record<string, Record<string, any>[]> = {}

                if (needsRelations) {
                    // A nested $expand reaches beyond this entity's own relations
                    // (`PostBudget($expand=Departmen(...))`), so walk the whole reachable
                    // graph rather than just the first hop. The engine is synchronous —
                    // anything not preloaded here silently resolves to an empty collection.
                    const seen = new Set<string>()
                    const queue = [entity.name]

                    while (queue.length) {
                        const current = queue.shift()!
                        if (seen.has(current)) continue
                        seen.add(current)

                        const currentEntity = schema.entities[current]
                        if (!currentEntity) continue

                        for (const field of currentEntity.relations) {
                            const target = field.relation!.targetEntity
                            if (!related[target]) {
                                related[target] = await readEntityRows(schema.baseUrl, target)
                            }
                            queue.push(target)
                        }
                    }
                }

                const result = executeQuery(rows, query, {
                    entity,
                    readEntity: (name) => related[name] ?? [],
                    entityOf: (name) => schema.entities[name],
                })

                return {
                    data: toODataEnvelope(result, Boolean(query.count)) as T,
                    statusCode: 200,
                    error: null,
                }
            }

            // A body that could not be parsed must fail loudly on a write, never be
            // stored. (GET/DELETE carry no body, so they don't care.)
            if (!body.ok && method !== 'GET' && method !== 'DELETE') {
                return fail(400, `[@mono-lit/utility/mock-db] ${method} ${body.message}`)
            }

            if (method === 'POST') {
                const { own, children } = splitDeepInsert(entity, row)

                const created = await store.insert(schema.baseUrl, entity.name, own)
                await writeChildren(schema, entity, created, children)

                return { data: created as T, statusCode: 201, error: null }
            }

            if (method === 'PUT' || method === 'PATCH') {
                if (rawKey == null) {
                    return fail(
                        400,
                        `[@mono-lit/utility/mock-db] ${method} needs a key — put it in the url ` +
                        `("${entity.name}(1)") or send it as payload.keyValue.`,
                    )
                }

                const { own, children } = splitDeepInsert(entity, row)

                // PATCH merges; PUT replaces (real OData semantics)
                const updated = await store.update(
                    schema.baseUrl,
                    entity.name,
                    rawKey,
                    own,
                    { merge: method === 'PATCH' },
                )
                if (!updated) return fail(404, `[@mono-lit/utility/mock-db] ${entity.name}(${rawKey}) not found`)

                await writeChildren(schema, entity, updated, children)

                return { data: updated as T, statusCode: 200, error: null }
            }

            if (method === 'DELETE') {
                if (rawKey == null) {
                    return fail(
                        400,
                        `[@mono-lit/utility/mock-db] DELETE needs a key — put it in the url ` +
                        `("${entity.name}(1)") or send it as payload.keyValue.`,
                    )
                }

                const removed = await store.remove(schema.baseUrl, entity.name, rawKey)
                if (!removed) return fail(404, `[@mono-lit/utility/mock-db] ${entity.name}(${rawKey}) not found`)

                return { data: null, statusCode: 200, error: null }
            }

            return fail(405, `[@mono-lit/utility/mock-db] ${method} is not supported`)
        } catch (error: any) {
            return fail(500, error?.message ?? String(error))
        }
    }

    return {
        ready,
        schemas,

        matches(url: string) {
            return Boolean(matchMockRoute(schemas, url))
        },

        request,

        async reset() {
            await ready
            if (!store) return
            await store.clear()
            await hydrate(true)
        },

        async export() {
            await ready
            const out: Record<string, Record<string, Record<string, any>[]>> = {}
            if (!store) return out

            for (const schema of schemas) {
                out[schema.baseUrl] = {}
                for (const entity of Object.values(schema.entities)) {
                    out[schema.baseUrl]![entity.name] = await store.read(schema.baseUrl, entity.name)
                }
            }
            return out
        },

        async import(data) {
            await ready
            if (!store) return

            for (const [baseUrl, tables] of Object.entries(data ?? {})) {
                for (const [entityName, rows] of Object.entries(tables ?? {})) {
                    await store.write(baseUrl, entityName, rows)
                }
            }
        },
    }
}

/**
 * Coerce a request body into a storable row, or explain why it isn't one.
 *
 * REST callers reach us through `monoFetch`, whose options are `RequestInit` — so
 * `body` is normally `JSON.stringify(obj)`, a STRING. Handing that to the store
 * spreads it character-by-character into `{"0":"{","1":"\"",…}` and writes that
 * garbage row with a 201. Normalising here (rather than only in the wrapper) means
 * no caller can corrupt the store, whichever entry point it came through.
 */
function normalizePayload(
    payload: unknown,
): { ok: true; row: Record<string, any> } | { ok: false; message: string } {
    let value: unknown = payload

    if (typeof value === 'string') {
        const text = value.trim()
        if (!text) return { ok: true, row: {} }
        try {
            value = JSON.parse(text)
        } catch {
            return { ok: false, message: 'body is a string but not valid JSON' }
        }
    }

    if (value == null) return { ok: true, row: {} }

    if (typeof value !== 'object' || Array.isArray(value)) {
        return { ok: false, message: `body must be an object, received ${Array.isArray(value) ? 'an array' : typeof value}` }
    }

    // FormData / Blob / File carry no enumerable own properties — they'd silently
    // store as `{}` rather than erroring, which is exactly the failure mode to avoid.
    const tag = Object.prototype.toString.call(value)
    if (tag !== '[object Object]') {
        return { ok: false, message: `body must be a plain object, received ${tag.slice(8, -1)}` }
    }

    return { ok: true, row: value as Record<string, any> }
}

/** `?a=1` off a url, so a caller can pass the whole url instead of params. */
function extractQuery(url: string): string {
    const at = String(url ?? '').indexOf('?')
    return at >= 0 ? url.slice(at + 1) : ''
}

/** Path keys arrive as strings; primary keys are usually numbers. */
function coerceKey(value: string): string | number {
    const asNumber = Number(value)
    return Number.isNaN(asNumber) || value.trim() === '' ? value : asNumber
}

/**
 * The page-wide mock backend, built from `mono.config.ts` `mockIndexedDB`.
 * Returns null when the app declares no mock — every caller must treat that as
 * "go to the network".
 */
export function monoMockDb(config?: MonoMockDbConfig): MonoMockDb | null {
    if (instance) return instance
    if (!config?.schema || !Object.keys(config.schema).length) return null

    instance = createMockDb(config)
    return instance
}

/** Test seam — drops the cached instance. */
export function resetMonoMockDb() {
    instance = null
}

export * from './schema'
export * from './odata'
export * from './apply'
export * from './generate'
export * from './store'
