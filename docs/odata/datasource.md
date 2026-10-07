# DataSource

A DataSource is a live, reactive handle to a remote OData endpoint that mono's table, select and dropdown-table components consume — it loads rows on demand (one page at a time), exposes paging, filtering and sorting, and re-renders the bound component whenever its data changes.

## What is a DataSource?

A **DataSource** is a live handle to a remote OData endpoint. Instead of fetching
rows into a plain array, you hand a component a DataSource and it **loads on
demand** — pulling one page at a time and exposing paging, filtering and sorting.

The key idea: a DataSource is **reactive**. It emits a `changed` event whenever
its data updates, and the bound component re-renders automatically. So you can
filter or sort the DataSource from anywhere — even outside the component — and
the UI stays in sync without re-binding.

Use it when the data lives on a server and you want the component to page /
search / filter against it, rather than loading everything up front.

## Create one with `monoCreateFetcher`

`monoCreateFetcher` builds a DataSource for an OData endpoint. Import it at the
top level and call `.response({ options })` — you get back a `dataSource` (plus
`data`, `statusCode`, `error`).

```ts
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

const { dataSource } = await monoCreateFetcher({
  baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
  url: '/People',
}).response({
  options: {
    key: 'UserName',
    select: ['UserName', 'FirstName', 'LastName', 'Gender'],
    paginate: true,
    pageSize: 10,
  },
})
```

- **`baseUrl`** — the OData root. To resolve it from your `mono.config.ts`
  instead, pass **`configBaseUrl: '<entry>'`** (see [Data Fetching](../repo/data-fetching)).
- **`url`** — the entity path appended to the base URL.
- **`options`** — devextreme DataSource options: `select`, `paginate`,
  `pageSize`, `sort`, `filter`, … The entity `key` defaults to `Id`, so you
  usually don't need to set it.

## Example: bind it to `mono-select`

Create the DataSource in `onMounted`, then bind it with `:data-source.prop`. Use
`key-value` / `display-value` to map the server fields, and `load-more="scroll"`
to page the source as the user scrolls.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

const ds = ref<any>(null)
const selected = ref<unknown>(null)

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
  }).response({
    options: {
      key: 'UserName',
      select: ['UserName', 'FirstName', 'LastName', 'Gender'],
      paginate: true,
      pageSize: 10,
    },
  })

  ds.value = dataSource
})

const onChange = (e: any) => {
  selected.value = e.detail.currentValue
}

// Filter the source from anywhere — the bound component updates through the
// DataSource's "changed" event, no re-binding needed.
const filterByName = async () => {
  ds.value?.filter(["contains(LastName, 'W')"])
  await ds.value?.load()
}
</script>

<template>
  <mono-select
    :data-source.prop="ds"
    load-more="scroll"
    key-value="UserName"
    display-value="LastName"
    label="Person"
    placeholder="Pick a person"
    @change="onChange"
  ></mono-select>
</template>
```

::: tip Why `:data-source.prop`?
A DataSource is an object. On a custom element, Vue would stringify a plain
`:data-source` binding into an attribute — so you must use the **`.prop`**
modifier to pass it as a real DOM property.
:::

## Need one record? `load({ take: 1 })`, never `byKey()`

To pull a single row from a DataSource, query it through `load` — add a `filter` if
you're matching on a field:

```ts
const [first] = await ds.value.load({ take: 1 })
// matching a specific row:
const [match] = await ds.value.load({ filter: ['Id', '=', id], take: 1 })
```

::: danger Don't use `ds.value.store().byKey(id)`
Once a DataSource is bound to a component, `byKey` reads from / **caches against the
data already loaded into that DataSource** — so it can hand you a **stale, cached** row
(or `undefined` for one that was never paged in) instead of a fresh result. Always use
`load({ take: 1 })` (with a `filter` when needed); it goes through the source's normal
query path and returns live data.
:::

## Components that accept a DataSource

The same `dataSource` works across these components:

### `mono-select`

A single-value picker. Bind `:data-source.prop`, map fields with `key-value` /
`display-value`, and page with `load-more="scroll"` (or `"button"`). See
[Select](/ui/select).

```vue
<mono-select :data-source.prop="ds" load-more="scroll"
  key-value="UserName" display-value="LastName"></mono-select>
```

### `mono-tag-input`

Multi-value version — same props, plus `:immediate.prop="true"` to load on
mount. See [Tag input](/ui/tag-input).

```vue
<mono-tag-input :data-source.prop="ds" :immediate.prop="true"
  load-more="scroll" key-value="UserName" display-value="LastName"></mono-tag-input>
```

### `mono-table`

A native table. Wrap the DataSource in a `controlMonoTable` controller, then bind the
controls with `:control-table.prop`. See [Table](/ui/table).

> No remote data? Pass a **plain array** straight to `controlMonoTable` —
> `controlMonoTable(rows, { pageSize: 10, searchValue: ['UserName', 'LastName'] })` — and it
> pages, searches and sorts in memory. Swap rows later with `table.setData(next)`.

```vue
<script setup lang="ts">
import { controlMonoTable } from '@mono-lit/helper'
const table = controlMonoTable(null, { searchValue: ['UserName', 'LastName'] })
// after creating `dataSource`: table.bind(dataSource); await table.load()
</script>

<template>
  <mono-table-search :control-table.prop="table"></mono-table-search>
  <!-- render your <table> from table.items … -->
  <mono-table-paging :control-table.prop="table"></mono-table-paging>
</template>
```
