// pkg/mock-db/devextreme.ts — bridge the mock engine to a DevExtreme DataSource.
//
// The sharp edge of the whole feature. A grid pushes filtering/sorting/paging to
// the SERVER via `loadOptions`; a naive in-memory store ignores them and quietly
// renders unfiltered, unsorted, unpaged rows that LOOK fine. So we translate
// loadOptions -> our OData query and let the same engine answer, exactly as
// ODataStore would have.

import type { MonoMockDb } from './index'
import type { MonoMockParsedEntity } from './schema'
import { executeQuery, parseExpand, type ODataQuery } from './odata'

/** DevExtreme filter expr -> OData $filter text. */
function filterToOData(filter: any): string | undefined {
    if (!Array.isArray(filter) || !filter.length) return undefined

    // A single raw OData string — DevExtreme's `calculateFilterExpression` escape
    // hatch, used for things its own filter syntax cannot express:
    //   calculateFilterExpression: () => [`Detail/any(d: d/Bulan eq 3)`]
    // Destructuring it as [field, operator, value] (operator undefined) used to emit
    // `Detail/any(...) eq ''`, so pass it through untouched.
    if (filter.length === 1 && typeof filter[0] === 'string') {
        return filter[0]
    }

    // group: [[...], 'and', [...]]  (also accepts implicit 'and' between groups)
    if (Array.isArray(filter[0])) {
        const parts: string[] = []
        for (const item of filter) {
            if (Array.isArray(item)) {
                const inner = filterToOData(item)
                if (inner) parts.push(`(${inner})`)
            } else if (typeof item === 'string') {
                parts.push(item.toLowerCase() === 'or' ? 'or' : 'and')
            }
        }
        return parts.join(' ') || undefined
    }

    // unary: ['!', [...]]
    if (filter[0] === '!' && Array.isArray(filter[1])) {
        const inner = filterToOData(filter[1])
        return inner ? `not (${inner})` : undefined
    }

    // binary: [field, op, value]
    const [field, operator, value] = filter as [string, string, any]
    if (typeof field !== 'string') return undefined

    const literal = typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : `'${String(value ?? '').replace(/'/g, "''")}'`

    switch (String(operator)) {
        case '=': return `${field} eq ${literal}`
        case '<>': return `${field} ne ${literal}`
        case '>': return `${field} gt ${literal}`
        case '>=': return `${field} ge ${literal}`
        case '<': return `${field} lt ${literal}`
        case '<=': return `${field} le ${literal}`
        case 'contains': return `contains(${field},${literal})`
        case 'notcontains': return `not contains(${field},${literal})`
        case 'startswith': return `startswith(${field},${literal})`
        case 'endswith': return `endswith(${field},${literal})`
        default: return `${field} eq ${literal}`
    }
}

/** DevExtreme `sort` -> our orderby rules. */
function sortToOrderBy(sort: any): ODataQuery['orderby'] {
    if (!sort) return undefined
    const list = Array.isArray(sort) ? sort : [sort]

    return list
        .map((rule: any) => {
            if (typeof rule === 'string') return { field: rule, desc: false }
            if (rule?.selector) return { field: String(rule.selector), desc: Boolean(rule.desc) }
            return null
        })
        .filter(Boolean) as ODataQuery['orderby']
}

/** DevExtreme summary spec: `{ selector, summaryType }`. */
export interface SummarySpec {
    selector?: string
    summaryType?: string
}

/** The grouped shape a DevExtreme grid expects back from a store. */
export interface GroupedResult {
    key: unknown
    items: Record<string, any>[] | null
    count: number
    summary?: unknown[]
}

/** Case-insensitive field read, matching the rest of the engine. */
function readField(row: Record<string, any>, name: string): unknown {
    if (name in row) return row[name]
    const lower = String(name).toLowerCase()
    const hit = Object.keys(row).find((key) => key.toLowerCase() === lower)
    return hit ? row[hit] : undefined
}

/** DevExtreme `group` loadOption -> selectors. Accepts string | {selector} | array. */
export function groupSelectors(group: any): { selector: string; desc: boolean }[] {
    if (!group) return []
    const list = Array.isArray(group) ? group : [group]

    return list
        .map((rule: any) => {
            if (typeof rule === 'string') return { selector: rule, desc: false }
            if (rule?.selector) return { selector: String(rule.selector), desc: Boolean(rule.desc) }
            return null
        })
        .filter(Boolean) as { selector: string; desc: boolean }[]
}

/** One summary value over a bucket of rows. */
function computeSummary(rows: Record<string, any>[], spec: SummarySpec): unknown {
    const type = String(spec.summaryType ?? 'count').toLowerCase()
    if (type === 'count') return rows.length

    const values = rows
        .map((row) => readField(row, String(spec.selector)))
        .filter((value) => value !== undefined && value !== null)
        .map(Number)
        .filter((value) => !Number.isNaN(value))

    // an empty set sums to 0, but has no min/max/avg — null, not 0, which would read
    // as a real measurement
    if (!values.length) return type === 'sum' ? 0 : null

    switch (type) {
        case 'sum': return values.reduce((total, value) => total + value, 0)
        case 'avg': return values.reduce((total, value) => total + value, 0) / values.length
        case 'min': return Math.min(...values)
        case 'max': return Math.max(...values)
        default: return null
    }
}

/**
 * Build DevExtreme's grouped result: `[{ key, items, count, summary }]`.
 *
 * A grid asks for grouping through `loadOptions.group`, NOT through OData `$apply`,
 * and it expects this exact shape back. Returning a flat array instead makes the
 * group panel render nothing while the rows still look fine — silently wrong.
 *
 * `groupInterval`/`isExpanded: false` collapse to `items: null` + a count, which is
 * how the grid lazy-loads group contents.
 */
export function groupRows(
    rows: Record<string, any>[],
    selectors: { selector: string; desc: boolean }[],
    options: { groupSummary?: SummarySpec[]; expanded?: boolean } = {},
): GroupedResult[] {
    if (!selectors.length) return []

    const [current, ...rest] = selectors
    const buckets = new Map<string, { key: unknown; items: Record<string, any>[] }>()

    for (const row of rows) {
        const key = readField(row, current!.selector) ?? null
        const id = JSON.stringify(key)
        const bucket = buckets.get(id)
        if (bucket) bucket.items.push(row)
        else buckets.set(id, { key, items: [row] })
    }

    const groups = [...buckets.values()].map(({ key, items }): GroupedResult => {
        const summary = options.groupSummary?.length
            ? options.groupSummary.map((spec) => computeSummary(items, spec))
            : undefined

        // nested grouping recurses; the leaf level holds the actual rows
        const children = rest.length
            ? groupRows(items, rest, options)
            : (options.expanded === false ? null : items)

        return {
            key,
            items: children as any,
            count: items.length,
            ...(summary ? { summary } : {}),
        }
    })

    groups.sort((a, b) => {
        const left = a.key as any
        const right = b.key as any
        if (left === right) return 0
        if (left == null) return -1
        if (right == null) return 1

        const numeric = typeof left === 'number' && typeof right === 'number'
        const cmp = numeric ? left - right : String(left).localeCompare(String(right))
        return current!.desc ? -cmp : cmp
    })

    return groups
}

/** Translate DevExtreme loadOptions into our query shape. */
export function loadOptionsToQuery(loadOptions: any): ODataQuery {
    const query: ODataQuery = {}

    const filter = filterToOData(loadOptions?.filter)
    if (filter) query.filter = filter

    const orderby = sortToOrderBy(loadOptions?.sort)
    if (orderby?.length) query.orderby = orderby

    if (typeof loadOptions?.skip === 'number') query.skip = loadOptions.skip
    if (typeof loadOptions?.take === 'number') query.top = loadOptions.take

    // The core passes a DataSourceOptions object (`options` on the fetch call), which pages
    // with paginate/pageSize rather than the take/skip a grid sends. Only honour it
    // when `take` was not given, so a grid's own paging always wins.
    if (query.top == null && loadOptions?.paginate !== false && typeof loadOptions?.pageSize === 'number') {
        query.top = loadOptions.pageSize
    }

    if (Array.isArray(loadOptions?.select) && loadOptions.select.length) {
        query.select = loadOptions.select.map(String)
    }
    if (loadOptions?.expand != null && (!Array.isArray(loadOptions.expand) || loadOptions.expand.length)) {
        // DevExtreme/the core pass expand as strings that may carry nested options
        // (`PostBudget($select=Id;$expand=Departmen($select=Code))`), so parse them
        // rather than treating each as a bare relation name.
        query.expand = parseExpand(loadOptions.expand)
    }

    // requireTotalCount -> the grid wants the pre-paging total
    if (loadOptions?.requireTotalCount) query.count = true

    return query
}

export interface MockDataSourceOptions {
    mock: MonoMockDb
    baseUrl: string
    entity: MonoMockParsedEntity
    /** @mono-lit/devextreme ctors, already resolved by getSharedSource(). */
    DataSource: any
    CustomStore: any
    /**
     * The caller's core `options` (DevExtreme DataSourceOptions: filter/sort/select/
     * paginate/pageSize). The core builds its DataSource as
     * `new DataSource({ ...options, store })`, so the mock must too — otherwise a
     * configured sort/filter/pageSize silently does nothing here but works in prod.
     */
    options?: Record<string, any>
}

/**
 * A DevExtreme `DataSource` over a `CustomStore` that answers from IndexedDB
 * through the same OData engine the fetch path uses — so a grid gets real
 * server-style paging/filtering/sorting instead of a silent full table.
 */
export function createMockDataSource({
    mock,
    baseUrl,
    entity,
    DataSource,
    CustomStore,
    options,
}: MockDataSourceOptions) {
    const readAll = async () => {
        const response = await mock.request<any>({
            url: `${baseUrl}/${entity.name}`,
            method: 'GET',
            params: {},
        })
        const payload = response.data
        return Array.isArray(payload?.value) ? payload.value : (payload ?? [])
    }

    const store = new CustomStore({
        key: entity.primaryKey,
        loadMode: 'processed',

        async load(loadOptions: any) {
            const query = loadOptionsToQuery(loadOptions)
            const rows = await readAll()

            // A filter may reach a navigation property, and a nested $expand reaches
            // beyond the first hop — so walk the reachable graph, same as index.ts.
            const schema = mock.schemas.find((candidate) => candidate.baseUrl === baseUrl)
            const related: Record<string, any[]> = {}

            if (query.expand?.length || query.filter) {
                const seen = new Set<string>()
                const queue = [entity.name]

                while (queue.length) {
                    const current = queue.shift()!
                    if (seen.has(current)) continue
                    seen.add(current)

                    const currentEntity = schema?.entities[current]
                    if (!currentEntity) continue

                    for (const field of currentEntity.relations) {
                        const target = field.relation!.targetEntity
                        if (!related[target]) {
                            const response = await mock.request<any>({
                                url: `${baseUrl}/${target}`,
                                method: 'GET',
                                params: {},
                            })
                            const payload = response.data
                            related[target] = Array.isArray(payload?.value) ? payload.value : (payload ?? [])
                        }
                        queue.push(target)
                    }
                }
            }

            const result = executeQuery(rows, query, {
                entity,
                readEntity: (name) => related[name] ?? [],
                entityOf: (name) => schema?.entities[name],
            })

            // A grouped grid expects `[{ key, items, count }]`, not a flat array. Hand
            // it rows instead and the group panel renders empty while the data still
            // looks fine — so grouping must be answered in DevExtreme's own shape.
            const selectors = groupSelectors(loadOptions?.group)
            if (selectors.length) {
                const groups = groupRows(result.rows, selectors, {
                    groupSummary: loadOptions?.groupSummary,
                    expanded: loadOptions?.group?.[0]?.isExpanded,
                })

                if (loadOptions?.requireTotalCount || loadOptions?.requireGroupCount) {
                    return {
                        data: groups,
                        totalCount: result.total,
                        groupCount: groups.length,
                        ...(loadOptions?.totalSummary?.length
                            ? { summary: loadOptions.totalSummary.map((spec: any) => computeSummary(result.rows, spec)) }
                            : {}),
                    }
                }
                return groups
            }

            // `requireTotalCount` expects { data, totalCount }; a bare array otherwise.
            if (loadOptions?.requireTotalCount) {
                return {
                    data: result.rows,
                    totalCount: result.total,
                    ...(loadOptions?.totalSummary?.length
                        ? { summary: loadOptions.totalSummary.map((spec: any) => computeSummary(result.rows, spec)) }
                        : {}),
                }
            }
            return result.rows
        },

        async byKey(key: any) {
            const response = await mock.request<any>({
                url: `${baseUrl}/${entity.name}(${key})`,
                method: 'GET',
            })
            return response.data
        },

        async insert(values: any) {
            const response = await mock.request<any>({
                url: `${baseUrl}/${entity.name}`,
                method: 'POST',
                payload: values,
            })
            if (response.error) throw new Error(response.error.message)
            return response.data
        },

        async update(key: any, values: any) {
            const response = await mock.request<any>({
                url: `${baseUrl}/${entity.name}(${key})`,
                method: 'PUT',
                payload: values,
            })
            if (response.error) throw new Error(response.error.message)
            return response.data
        },

        async remove(key: any) {
            const response = await mock.request<any>({
                url: `${baseUrl}/${entity.name}(${key})`,
                method: 'DELETE',
            })
            if (response.error) throw new Error(response.error.message)
        },
    })

    // Mirror the core: `new DataSource({ ...options, store })`. DevExtreme merges the
    // DataSource's own filter/sort/select into the loadOptions it hands to
    // store.load(), so the CustomStore above sees them and the query engine applies
    // them — same as it would against a real ODataStore.
    const { key: _key, ...dataSourceOptions } = (options ?? {}) as Record<string, any>

    return new DataSource({
        ...dataSourceOptions,
        store,
        key: entity.primaryKey,
    })
}
