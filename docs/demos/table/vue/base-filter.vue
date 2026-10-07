<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/select'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = {
  OrderID: number
  ShipName: string
  ShipCountry: string
  ShipCity: string
}

// One scope, two ways of handing it to the grid. Change the country, then
// search, sort, filter a column, page — the scope is under every request in
// both grids, and clearing the search box brings back the scoped set, not the
// whole table.
const country = ref<string>('Germany')
const countries = [
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'UK' },
]
const scopeFilter = () => (country.value ? ['ShipCountry', '=', country.value] : null)

const columns = [
  { field: 'ShipName', caption: 'Ship to', sort: true },
  { field: 'ShipCity', caption: 'City', sort: true, headerFilter: true },
]

// ── A: the source is scoped directly. ────────────────────────────────────────
// `ds.filter(...)` + `table.load()` — the pattern a store watcher has always
// written. The grid ADOPTS whatever it finds on the source and composes its own
// search / column filters on top, so this needs nothing new.
const tableA = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  searchValue: ['ShipName', 'ShipCity'],
  props: { th: columns },
})
const dsA = ref<any>(null)
const rowsA = ref<OrderRow[]>([])
const filterA = ref('')
const offA = tableA.subscribe(() => {
  rowsA.value = [...tableA.items]
  filterA.value = JSON.stringify(dsA.value?.filter() ?? null)
})

// ── B: the scope is DERIVED from reactive state. ────────────────────────────
// `dataSourceOptions` is read fresh at every query, so a `computed` (or a plain
// getter) is the natural fit: nothing to mirror into the source by hand. A
// change to the state still has to ASK for a query — that is `refresh()`.
const tableB = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  searchValue: ['ShipName', 'ShipCity'],
  props: { th: columns },
  dataSourceOptions: computed(() => ({
    filter: scopeFilter(),
    select: ['OrderID', 'ShipName', 'ShipCountry', 'ShipCity'],
  })),
})
const dsB = ref<any>(null)
const rowsB = ref<OrderRow[]>([])
const filterB = ref('')
const offB = tableB.subscribe(() => {
  rowsB.value = [...tableB.items]
  filterB.value = JSON.stringify(dsB.value?.filter() ?? null)
})

const makeSource = () =>
  monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'ShipName', 'ShipCountry', 'ShipCity'],
      paginate: true,
      pageSize: 6,
    },
  })

onMounted(async () => {
  const [a, b] = await Promise.all([makeSource(), makeSource()])
  dsA.value = a.dataSource
  dsB.value = b.dataSource

  // A: scope the source itself, then bind.
  dsA.value.filter(scopeFilter())
  tableA.bind(dsA.value)
  tableB.bind(dsB.value)
  await Promise.all([tableA.load(), tableB.load()])
})

watch(country, async () => {
  // A: write the new scope onto the source; the grid adopts it on this load.
  if (dsA.value) {
    dsA.value.filter(scopeFilter())
    await tableA.load()
  }
  // B: the computed already holds the new scope; ask for a query.
  await tableB.refresh()
})

onBeforeUnmount(() => {
  offA()
  offB()
  tableA.dispose()
  tableB.dispose()
})
</script>

<template>
  <div class="example-demo">
    <div class="example-scope">
      <span class="example-label">Scope</span>
      <mono-select
        size="sm"
        width="12rem"
        :items.prop="countries"
        key-value="value"
        display-value="label"
        :model-value="country"
        @change="country = $event.detail.modelValue"
      />
    </div>

    <div class="example-grids">
      <mono-card
        v-for="grid in [
          { key: 'A', title: 'ds.filter(…) — adopted', table: tableA, rows: rowsA, filter: filterA },
          { key: 'B', title: 'dataSourceOptions: computed(…)', table: tableB, rows: rowsB, filter: filterB },
        ]"
        :key="grid.key"
        bordered
        width="100%"
        class="example-card"
      >
        <div class="example-toolbar">
          <strong class="example-title">{{ grid.title }}</strong>
          <mono-table-search :control-table.prop="grid.table" size="sm" placeholder="Search…" />
        </div>

        <div mono-table-scroll>
          <table mono-table>
            <caption><mono-table-loading :control-table.prop="grid.table" /></caption>
            <thead>
              <tr>
                <th v-for="c in columns" :key="c.field">
                  <mono-table-th :control-table.prop="grid.table" :field="c.field" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in grid.rows" :key="row.OrderID">
                <td>{{ row.ShipName }}</td>
                <td>{{ row.ShipCity }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div mono-table-foot>
          <mono-table-info :control-table.prop="grid.table" />
          <mono-table-paging :control-table.prop="grid.table" />
        </div>

        <!-- What the source holds right now: the scope stays under every request. -->
        <code class="example-filter">filter() = {{ grid.filter }}</code>
      </mono-card>
    </div>
  </div>
</template>

<style scoped>
.example-demo {
  display: grid;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
}

.example-scope {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.example-label {
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.7;
}

.example-grids {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
}

.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
  min-width: 0;
}

.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
}

.example-title {
  font-size: 0.85rem;
}

.example-filter {
  display: block;
  padding: 0.4rem 0.75rem;
  font-size: 0.7rem;
  overflow-wrap: anywhere;
  opacity: 0.75;
}
</style>
