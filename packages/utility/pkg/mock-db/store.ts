// pkg/mock-db/store.ts — the IndexedDB layer.
//
// Native IndexedDB, not `unstorage/drivers/indexedb`: that driver needs
// `idb-keyval` (an OPTIONAL peer of unstorage, not installed here — and adding a
// dep is expensive because @mono-lit/utility ships a committed dist/), and it is
// key-value only, so every read would deserialize a whole table anyway. Going
// native gives one object store per entity with a real `keyPath` and an index per
// foreign key, for zero new dependencies.
//
// The one impure module in mock-db — everything else stays testable in node.

import type { MonoMockParsedSchema } from './schema'

/** Storage keys are namespaced by base-url so two apps can't collide. */
function storeName(baseUrl: string, entity: string): string {
    return `${baseUrl}::${entity}`
}

export function isIndexedDbAvailable(): boolean {
    return typeof indexedDB !== 'undefined'
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

/**
 * Make a value safe for IndexedDB.
 *
 * IndexedDB persists with the STRUCTURED CLONE algorithm, which throws
 * `DataCloneError` on Proxies — and a Vue `reactive()`/`ref()` object IS a Proxy.
 * Apps hand store state straight to a POST all the time, so without this the very
 * first realistic write blows up with an error that says nothing about Vue.
 *
 * structuredClone() is tried first (keeps Date, Map, Set); the JSON round-trip is
 * the fallback that flattens a proxy — its `get` traps make stringify work fine.
 */
function toPlain<T>(value: T): T {
    try {
        return structuredClone(value)
    } catch {
        return JSON.parse(JSON.stringify(value))
    }
}

export interface MonoMockStore {
    read(baseUrl: string, entity: string): Promise<Record<string, any>[]>
    write(baseUrl: string, entity: string, rows: Record<string, any>[]): Promise<void>
    insert(baseUrl: string, entity: string, row: Record<string, any>): Promise<Record<string, any>>
    /**
     * `merge: true` (PATCH) keeps fields absent from `changes`.
     * `merge: false` (PUT) REPLACES the row, carrying over only the primary key —
     * which is what a real OData PUT does. A merging PUT would hide the production
     * bug where a partial PUT nulls out the fields you omitted.
     */
    update(
        baseUrl: string,
        entity: string,
        key: any,
        changes: Record<string, any>,
        options?: { merge?: boolean },
    ): Promise<Record<string, any> | null>
    remove(baseUrl: string, entity: string, key: any): Promise<boolean>
    clear(): Promise<void>
    close(): void
}

/**
 * Open (and upgrade) the database. Every entity across every base-url becomes an
 * object store keyed on its declared primary key, with an index per foreign key.
 *
 * `version` comes from the config: bumping it triggers `onupgradeneeded`, which
 * drops and recreates the stores — i.e. a schema change WIPES the user's data.
 * That's correct for a mock, but it is destructive and therefore logged.
 */
export async function openMockDb(
    dbName: string,
    version: number,
    schemas: MonoMockParsedSchema[],
): Promise<IDBDatabase> {
    if (!isIndexedDbAvailable()) {
        throw new Error(
            '[@mono-lit/utility/mock-db] IndexedDB is unavailable. The mock backend is browser-only — ' +
            'it cannot run during SSR/prerender. Mark the page client-only (Nuxt: `routeRules: ' +
            "{ '/your-page': { ssr: false } }`).",
        )
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version)

        request.onupgradeneeded = () => {
            const db = request.result

            for (const schema of schemas) {
                for (const entity of Object.values(schema.entities)) {
                    const name = storeName(schema.baseUrl, entity.name)

                    // recreate from scratch — the schema may have changed shape
                    if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name)

                    const store = db.createObjectStore(name, { keyPath: entity.primaryKey })

                    for (const field of entity.columns) {
                        if (field.foreign) store.createIndex(field.name, field.name, { unique: false })
                    }
                }
            }

            console.warn(
                `[@mono-lit/utility/mock-db] "${dbName}" upgraded to v${version} — stores were recreated and existing mock data discarded.`,
            )
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        request.onblocked = () =>
            reject(new Error(`[@mono-lit/utility/mock-db] "${dbName}" upgrade blocked — close other tabs and reload.`))
    })
}

export function createMockStore(db: IDBDatabase): MonoMockStore {
    function transaction(name: string, mode: IDBTransactionMode) {
        return db.transaction(name, mode).objectStore(name)
    }

    return {
        async read(baseUrl, entity) {
            const name = storeName(baseUrl, entity)
            if (!db.objectStoreNames.contains(name)) return []
            return (await promisify(transaction(name, 'readonly').getAll())) ?? []
        },

        async write(baseUrl, entity, rows) {
            const name = storeName(baseUrl, entity)
            if (!db.objectStoreNames.contains(name)) return

            const tx = db.transaction(name, 'readwrite')
            const store = tx.objectStore(name)
            store.clear()
            for (const row of rows) store.put(toPlain(row))

            await new Promise<void>((resolve, reject) => {
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error)
                tx.onabort = () => reject(tx.error)
            })
        },

        async insert(baseUrl, entity, row) {
            const name = storeName(baseUrl, entity)
            const store = transaction(name, 'readwrite')
            const keyPath = String(store.keyPath)

            const record = toPlain({ ...row })

            // Auto-assign the primary key when the caller didn't supply one. An
            // autoIncrement store can't be used because the PK is app-defined, so
            // derive the next value from the existing max.
            if (record[keyPath] == null) {
                const existing = (await promisify(transaction(name, 'readonly').getAll())) ?? []
                const max = existing.reduce((highest: number, current: any) => {
                    const value = Number(current?.[keyPath])
                    return Number.isFinite(value) && value > highest ? value : highest
                }, 0)
                record[keyPath] = max + 1
            }

            await promisify(transaction(name, 'readwrite').put(record))
            return record
        },

        async update(baseUrl, entity, key, changes, options) {
            const name = storeName(baseUrl, entity)
            const existing = await promisify(transaction(name, 'readonly').get(key))
            if (!existing) return null

            const store = transaction(name, 'readwrite')
            const keyPath = String(store.keyPath)
            const merge = options?.merge ?? true

            const next = toPlain({
                // PATCH keeps the untouched fields; PUT drops them (a true replace)
                ...(merge ? existing : {}),
                ...changes,
                // the key is immutable either way: an update must never re-key the row
                [keyPath]: existing[keyPath],
            })

            await promisify(store.put(next))
            return next
        },

        async remove(baseUrl, entity, key) {
            const name = storeName(baseUrl, entity)
            const existing = await promisify(transaction(name, 'readonly').get(key))
            if (!existing) return false

            await promisify(transaction(name, 'readwrite').delete(key))
            return true
        },

        async clear() {
            for (const name of Array.from(db.objectStoreNames)) {
                await promisify(transaction(name, 'readwrite').clear())
            }
        },

        close() {
            db.close()
        },
    }
}
