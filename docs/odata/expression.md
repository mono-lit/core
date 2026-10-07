# OData Expression

OData is a REST protocol with a **standard query language built into the URL** — you shape the response with `$`-prefixed options like `$select`, `$filter` and `$expand` instead of asking the backend for a new endpoint. This page explains those options and shows how to send each one through `monoFetchOdata`, live against a public OData v4 service.

## What is OData

A plain REST endpoint returns whatever the backend decided to return. An OData endpoint returns whatever **you** ask for, because the query is part of the URL:

```
GET https://services.odata.org/TripPinRESTierService/People
    ?$select=UserName,FirstName
    &$filter=contains(FirstName,'A')
    &$orderby=FirstName
    &$top=5
```

Three things come with that:

- **One endpoint, many shapes.** Fewer fields, filtered rows, sorted, paged — no backend change.
- **A published schema.** Every service exposes `$metadata` describing its entities. That is what [OData Types](./types) generates TypeScript from.
- **The work happens on the server.** Filtering and aggregation run in the database, not in the browser.

The `$`-prefixed parts are called **system query options**. They are the whole subject of this page.

## System Query Options

`monoFetchOdata` gives you two ways to send them:

| Channel | What you write | What happens |
| --- | --- | --- |
| **`options`** | The DevExtreme shape — `select`, `expand`, `filter`, `sort`, `pageSize`, `pageIndex`, `requireTotalCount` | DevExtreme translates it into the `$` params. **You never write `$` keys here.** |
| **`params`** | A raw query-string map — `{ $apply: '…' }` | Sent through verbatim. The only way to reach options DevExtreme has no equivalent for. |

The full list:

| Option | What it does | Example |
| --- | --- | --- |
| `$select` | Return only these fields | `$select=UserName,FirstName` |
| `$expand` | Inline a related entity | `$expand=Trips` |
| `$filter` | Keep only matching rows | `$filter=Age gt 30` |
| `$orderby` | Sort the result | `$orderby=LastName desc` |
| `$top` | Take at most N rows | `$top=10` |
| `$skip` | Skip the first N rows | `$skip=20` |
| `$count` | Include the total row count | `$count=true` |
| `$search` | Free-text search | `$search=Boise` |
| `$apply` | Group and aggregate server-side | `$apply=groupby((Gender),aggregate($count as Total))` |
| `$compute` | Add a calculated field to the result | `$compute=Budget mul 2 as Doubled` |
| `$format` | Response format | `$format=json` |
| `$index` | Insert position in a collection | `$index=0` |
| `$schemaversion` | Pin the schema version | `$schemaversion=1.0` |

::: tip Nested options need `params`
`options.expand` only takes plain navigation names. To put inner options inside an expand —
`$expand=Trips($select=Name;$top=1)` — write it as a raw param instead:

```ts
params: { $expand: 'Trips($select=Name,Budget;$top=1)' }
```
:::

::: tip Paging is `pageSize` / `pageIndex`, not `take` / `skip`
`monoFetchOdata` builds a DevExtreme DataSource, and a DataSource pages itself: `pageSize`
becomes `$top` and `pageIndex` becomes `$skip` (the offset is `pageIndex * pageSize`). A `take`
or `skip` passed in `options` is ignored, and you silently get the DataSource default
`$top=20` instead.
:::

::: warning `$apply` needs `paginate: false`
When you send `$apply`, also set `options.paginate = false`. Otherwise DevExtreme attaches its
default `$top=20` and silently truncates the aggregation buckets.
:::

For the operators and functions you can use inside `$filter` (`eq`, `gt`, `contains`, `startswith`, `any`/`all`, …), see the reference in [Mock API](../repo/mock-api).

## Try it

Each tab is a real request against the public [TripPin](https://services.odata.org/TripPinRESTierService) OData v4 service. Switch tabs to change the example, then press **Run**.

The snippet in each tab is not a mock-up — it is the exact `monoFetchOdata` call the button executes, rendered from the same argument object that gets passed in. After a run the panel also shows the **actual request URL** the browser sent, read back from the browser's own resource timings, so you can see precisely which `$` params came out the other end.

<ClientOnly>
  <OdataExpressionDemo />
</ClientOnly>

## See also

- [Data Fetching](../repo/data-fetching) — configuring `fetching.api`, `configBaseUrl`, and auth tokens.
- [OData Types](./types) — generating TypeScript types from `$metadata`.
- [DataSource](./datasource) — `monoCreateFetcher` and binding a live DataSource to a component.
- [Mock API](../repo/mock-api) — the supported `$filter` operators and the `$apply` pipeline.
