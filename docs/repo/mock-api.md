# Mock API

Sometimes the backend isn't ready, or you want a demo that anyone can click through without a server behind it. Mono ships a **mock backend that lives in the browser's IndexedDB**. You declare a schema in `mono.config.ts`, and every fetching call whose URL matches that schema is answered locally — the request never leaves the page.

Because there is no server, there is no port to pick, no CORS to configure, and nothing extra to start. The same code runs in dev and in a static production build, it works offline, and each visitor gets their own private copy of the data.

Every app declares its own schema, and they all merge into one store, so a host and its remotes can each bring their own mock data without stepping on each other.

## Quick start

Add a `mockIndexedDB` block to your `mono.config.ts`. The key of `schema` is a **base-url** — a name you invent — and under it you list your entities:

```ts
import { defineConfig } from '@mono-lit/utility/config'

export default defineConfig({
    name: 'flow-app',
    type: 'vue',
    apps: [],
    mockIndexedDB: {
        dbName: 'flow-app-mock',
        version: 1,
        schema: {
            'flow-mock': {
                users: {
                    fields: {
                        Id: 'number|primary',
                        Name: 'string',
                    },
                },
            },
        },
    },
})
```

Now fetch it. Put the base-url in the call's URL and the request is served from IndexedDB:

```ts
import { monoFetchOdata } from '@mono-lit/utility/fetching'

const { data } = await monoFetchOdata({
    url: '/flow-mock/users',
    type: 'data',
})
```

That's it — nothing to start, nothing to configure.

## The schema

Each field is declared with a small string DSL, `'<type>|<modifier>'`:

- **type** — `number`, `string`, `boolean`, `date`, `object` or `array`
- **modifier** — `primary`, `foreign`, or a relation

Exactly one field must be `primary`. `mono db validate` will tell you if you forget.

### Relations

A relation is written `object|A->B:C` or `array|A->B:C`, and it always means the same thing:

> **`A->B:C` = "rows of B where `B[C]` equals `row[A]`"**

`object` gives you the first match, `array` gives you all of them. So a one-to-many belongs on the **parent**, and a many-to-one on the **child**:

```ts
users: {
    fields: {
        id: 'number|primary',
        name: 'string',
        cars: 'array|id->cars:userId',      // parent -> its children
    },
},
cars: {
    fields: {
        id: 'number|primary',
        userId: 'number|foreign',
        user: 'object|userId->users:id',    // child -> its parent
    },
},
```

It's easy to put the `array` relation on the wrong side. `cars: { users: 'array|userId->users:id' }` is *syntactically* fine, but it reads "this car has many users" — which is not what you meant.

Relations are **virtual**. They are never stored as columns; they are materialised only when you ask for them with `$expand`, or when a filter walks them.

## Seed data

Entities with no explicit seed are **generated** — deterministically, so the same rows come back on every reload and a failing test reproduces. Tune it with `seedCount` (rows per entity, default 10) and `seedRandom` (the RNG seed). Parents are generated before children, and every foreign key is pointed at a **real** parent row, so `$expand` actually returns something.

The generator is fine for `users`/`orders`-shaped data. It is useless the moment an app *parses* what it reads — an enum-like column (`Type: 'start' | 'approver' | 'end'`), an icon class, a serialized JSON blob. Random strings there make the page unusable. For those, give the entity a `seed` and it wins over the generator:

```ts
import nodesJson from './src/datas/mock/nodes.json'

nodes: {
    fields: {
        Id: 'number|primary',
        Name: 'string',
        Type: 'string',
        Icon: 'string',
    },
    seed: nodesJson,
},
```

Seed fixtures must be **importable at build time** (a literal, or an imported JSON module). Fetching them at runtime would defeat the whole point — there is no server to fetch them from in a static build.

## How a call reaches the mock

The URL must carry the base-url. There are two ways to do that.

**Inline**, which is the simplest:

```ts
await monoFetchOdata({ url: '/flow-mock/users', type: 'data' })
```

**Or through a named entry**, by pointing `fetching.api` at the base-url and selecting it with `configBaseUrl`:

```ts
fetching: {
    api: {
        flowOdata: { type: 'odata', url: 'flow-mock' },
    },
},
```

```ts
await monoFetchOdata({ configBaseUrl: 'flowOdata', url: '/users', type: 'data' })
```

Both resolve to `flow-mock/users`. The second is worth the extra line when you expect to move onto a real backend later — see the last section.

What you cannot do is leave the base-url out entirely. `url: '/users'` matches no schema, so the call falls through to the real fetcher and throws *"no odata base url"*.

That's deliberate. Every app's `mockIndexedDB.schema` is **merged into one store** (see [Multiple apps](#multiple-apps)), so two apps can each declare a `users` entity. The base-url is what keeps them apart.

## Querying

The mock speaks a practical subset of OData v4, parsed properly — not pattern-matched — so precedence, parentheses and nesting behave the way they do on a real service.

`$filter` supports:

- comparisons `eq ne gt ge lt le`, `and` / `or` / `not`, and parentheses
- `contains`, `startswith`, `endswith`, `tolower`, `toupper`, `trim`, `length`, `concat`, `indexof`, `substring`
- `year`, `month`, `day`, `hour`, `minute`, `second` — and unquoted ISO date literals, compared as instants
- `Field in (1,2,3)`
- navigation paths — `PostBudget/Nama eq 'X'`
- lambdas — `Detail/any(d: d/Bulan eq 3)` and `Detail/all(...)`
- collection counts — `Detail/$count gt 0`

Alongside it: `$select`, `$orderby`, `$top`, `$skip`, `$count`, `$expand` and `$apply`.

A filter can walk a relation even when you never expanded it — the mock joins it on demand.

### Nested `$expand`

`$expand` takes options inside the parens, and they are applied to the **children**, not ignored:

```ts
await monoFetchOdata({
    url: '/api/Header',
    type: 'data',
    params: {
        $expand: "Approval($select=Id;$expand=Step($select=ActionType);$filter=Status eq 'Menunggu';$top=1)",
    },
})
```

That returns the one pending approval, with only the fields you asked for. `$select`, `$expand`, `$filter`, `$orderby`, `$top` and `$skip` all work, and nesting can go more than one level deep.

### `$apply`

Grouping and aggregation work as a transformation pipeline, with segments separated by `/`:

```
$apply=filter(Price gt 10)/groupby((Category),aggregate(Price with sum as Total))
```

Supported: `filter(...)`, `groupby((A,B), aggregate(...))`, a bare `aggregate(...)`, `$count as Alias`, and the methods `sum`, `average`, `min`, `max`, `count`, `countdistinct`. `groupby` can group by a navigation path (`groupby((PostBudget/ParentName))`).

One rule is worth internalising, because getting it backwards gives you right-looking numbers over the wrong rows:

- **`filter(...)` inside `$apply` runs *before* the grouping.**
- **A top-level `$filter` runs *after*** — it filters the aggregated rows (`$filter=Total gt 500`).

`@odata.count` follows the same logic: after `$apply` it counts the **groups**, not the source rows.

## DevExtreme

Grids and select boxes work without any special handling. `loadOptions` (`filter`, `sort`, `skip`, `take`, `select`, `expand`, `requireTotalCount`) is translated into the same query engine, so paging, filtering and sorting really happen instead of the grid quietly receiving the whole table.

Grouping is answered in DevExtreme's own shape — `{ key, items, count }`, with `groupSummary` / `totalSummary` — and collapsed groups return `items: null` with a correct `count`.

A raw `calculateFilterExpression` string is passed through untouched, so this keeps working:

```ts
calculateFilterExpression(filterValue) {
    return [`Detail/any(d: contains(tolower(d/KodeDept), '${filterValue}'))`]
},
```

## Writing data

All four verbs work.

- **`POST`** inserts and returns `201`. If you don't supply the primary key, one is assigned.
- **`PUT`** **replaces** the row (a field you omit is gone afterwards) — real OData semantics.
- **`PATCH`** **merges** (an omitted field survives).
- **`DELETE`** removes the row.

The key is looked for in three places, in order: the **url** (`/api/users(1)` or `/api/users/1`), then `payload.keyValue`, then the body's own primary key. So the idiomatic @mono-lit/utility write works as-is:

```ts
await monoFetchOdata({
    url: '/flow-mock/flows',
    method: 'PUT',
    type: 'datasource',
    payload: { data, keyValue: 12, keyName: 'Id' },
})
```

### Deep insert

If a field in the body matches an **`array` relation**, its rows are created in the child entity set with the foreign key pointed at the new parent — exactly as a real OData deep insert does. They are *not* stored as a blob column on the parent:

```ts
await monoFetchOdata({
    url: '/api/Header',
    method: 'POST',
    type: 'datasource',
    payload: {
        data: {
            Nama: 'Projek A',
            BudgetAlokasi: [{ NamaActivity: 'Activity 1' }, { NamaActivity: 'Activity 2' }],
        },
        keyName: 'Id',
    },
})
```

Afterwards, `GET /api/Alokasi` returns both children, and `$expand=BudgetAlokasi` brings them back on the parent.

## Every fetcher works

The mock sits behind the whole fetching surface, so nothing about how you call it changes:

- **`monoFetchOdata`** — `type: 'data'` runs the query and returns the **array**; `type: 'datasource'` returns a DevExtreme `DataSource`.
- **`monoCreateFetcher(...).response()`** — returns `{ dataSource }` as usual.
- **`monoFetch`** — plain REST, including path-style keys (`/api/users/1`). A `JSON.stringify`'d body is parsed for you.

`options` (the DevExtreme `DataSourceOptions` shape — `select`, `filter`, `sort`, `expand`, `paginate`, `pageSize`) is honoured on every one of them, and raw `$`-params win over `options` when both are given.

## Managing the store at runtime

Because the data lives in the browser, the store is managed from the browser:

```ts
import { monoMockDb } from '@mono-lit/utility/fetching'

const mock = monoMockDb()

await mock?.reset()          // wipe and re-seed
const dump = await mock?.export()   // every table, as plain JSON
await mock?.import(dump)     // put it back
```

`export()` is the easy way to turn generated rows into fixtures: dump them, paste them into an entity's `seed`.

## The CLI

`mono db` covers everything that can be checked without a browser:

```bash
mono db validate                  # parse every schema, report bad fields/relations
mono db preview --entity users    # print the rows the generator would produce
mono db export --out seed.json    # write generated rows to a file
```

`validate` exits non-zero on a bad schema, so it works in CI.

There is deliberately **no `mono db serve`**. The store is the browser's IndexedDB — there is nothing for a Node process to listen on, and nothing for it to read either. That is why `reset` and `export` at runtime are the browser APIs above, not CLI commands.

## Multiple apps

Schemas merge across apps on their own. `mockIndexedDB.schema` is a plain object, so a host and its remotes each contribute their own base-url and they all end up in one IndexedDB — no coordination needed.

One thing to watch: **keep everything inside `mockIndexedDB` a keyed object.** Arrays are *concatenated* when configs merge and are never de-duplicated, so an array option would silently double up once two apps declared it.

## Limits and gotchas

**IndexedDB does not exist during SSR or prerendering.** The mock is browser-only. On a Nuxt host, mark a page that uses it client-only, or `nuxt build` will fail while prerendering:

```ts
// nuxt.config.ts
routeRules: {
    '/flow': { ssr: false },
},
```

**Private browsing** may restrict or memory-back IndexedDB. The store fails to open, requests return `503`, and lists render empty — a deployed demo opened in incognito can look broken.

**Bumping `version` wipes the store** and re-seeds it. That is intended for a schema change, but it is destructive: anything the user saved is gone.

**Not supported**, because nothing in our apps uses them: `$batch`, `$search`, `substringof`, composite or GUID keys, and the arithmetic operators (`add` / `sub` / `mul` / `div`). Anything unsupported throws a clear error rather than silently returning wrong data.

## Moving to a real backend

Nothing about the calls has to change. Declare a real `fetching.api` entry and select it with `configBaseUrl`:

```ts
fetching: {
    api: {
        myOdata: {
            type: 'odata',
            url: String(import.meta.env.MONO_APP_ODATA_BASE_URL),
            oDataService: DefaultService,
        },
    },
},
```

```ts
await monoFetchOdata({ configBaseUrl: 'myOdata', url: '/users', type: 'data' })
```

The URL no longer matches a mock schema, so the same call goes to the network. Keep the `mockIndexedDB` block if you want the mock available for tests or offline demos — it only ever intercepts URLs that match one of its base-urls.
