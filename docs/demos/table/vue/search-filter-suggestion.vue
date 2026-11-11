<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/card'
import { controlMonoTable } from '@mono-lit/helper'
import { controlMonoForm } from '@mono-lit/helper/ui/form'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = { OrderID: number; ShipName: string; ShipCity: string; ShipCountry: string }

// The countries THIS user may pick — think of a list scoped by the login.
//
// The suggestion only ever proposes a value this select itself offers. So:
//   • "hanari" → its 14 orders ship to Brazil, which IS listed → "Adjust Filter" offered.
//   • "ernst"  → its 30 orders all ship to Austria, which is NOT listed below → no
//                suggestion at all; the empty state keeps its normal subtitle.
// Add `{ value: 'Austria', label: 'Austria' }` here and "ernst" gets an offer too.
const COUNTRIES = [
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'UK' },
]

// The filter form. `Country` filters the table's `ShipCountry` column.
const form = controlMonoForm({
  inputs: {
    Country: {
      component: 'mono-select',
      value: 'Germany',
      props: { items: COUNTRIES, keyValue: 'value', displayValue: 'label' },
    },
  },
})

// The form IS the table's base filter: the getter is read on every query.
const table = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  searchValue: ['ShipName', 'ShipCity'],
  dataSourceOptions: () => {
    const country = form.values().Country
    return country ? { filter: ['ShipCountry', '=', country] } : {}
  },
})
const rows = ref<OrderRow[]>([])
const log = ref<string[]>([])

const offTable = table.subscribe(() => { rows.value = [...table.items] })

// Picking another country re-runs the query (refresh() re-reads the getter).
// Guarded on the value: the form also notifies for things that are not a change.
let lastCountry = form.values().Country
const offForm = form.subscribe(() => {
  const country = form.values().Country
  if (country === lastCountry) return
  lastCountry = country
  void table.refresh()
})

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'ShipName', 'ShipCity', 'ShipCountry'],
      paginate: true,
      pageSize: 6,
    },
  })
  table.bind(dataSource)
  await table.load()
})

function onAdjust(e: CustomEvent) {
  // The form already holds the new value and the subscription above re-queries on
  // it, so the default `table.refresh()` is skipped. A page that builds its query by
  // hand (a "Cari Data" handler) does the same and calls that handler here.
  e.preventDefault()
  const d = e.detail
  log.value = [`[adjust] ${d.key}: ${d.current} → ${d.value} (${d.count} orders)`, ...log.value].slice(0, 6)
}

onBeforeUnmount(() => { offTable(); offForm(); table.dispose() })
</script>

<template>
  <div style="width: 100%;">
    <mono-card bordered width="100%" class="example-card">
      <div class="example-toolbar">
        <mono-select :control-form.prop="form" key-form="Country" label="Ship country" />
        <!-- Try "hanari" (Brazil: offered) and "ernst" (Austria: not in COUNTRIES, so
             never offered — see the note above COUNTRIES).
             requestType: 'count' — Northwind rejects $apply, so instead of the default
             one-$apply count this sends one `$top=0&$count=true` per allowed country
             (4 small requests, no rows downloaded, no failed request). -->

        <mono-table-search
          :control-table.prop="table"
          :control-form.prop="form"
          :suggestion-filter.prop="{ keys: { ShipCountry: 'Country' }, requestType: 'count' }"
          clearable
          label="Search ship name or city"
          placeholder="Try “hanari”, then “ernst”…"
          data-search />
      </div>

      <div mono-table-scroll>
        <table mono-table>
          <caption>
            <mono-table-loading :control-table.prop="table"></mono-table-loading>
            <!-- While a suggestion is offered, its message replaces the subtitle and
                 Adjust Filter sits right of Reload. `message` takes a function or a
                 template ({count}, {value}, {key}, {field}). -->
            <mono-table-empty
              :control-table.prop="table"
              :control-form.prop="form"
              :suggestion-filter.prop="{
                message: (count: number) => `There are ${count} matching orders under a different country — adjust the filter?`,
              }"
              @adjust="onAdjust"
            ></mono-table-empty>
          </caption>
          <thead>
            <tr><th>Order</th><th>Ship to</th><th>City</th><th>Country</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.OrderID">
              <td>{{ row.OrderID }}</td>
              <td>{{ row.ShipName }}</td>
              <td>{{ row.ShipCity }}</td>
              <td>{{ row.ShipCountry }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <mono-table-paging :control-table.prop="table"></mono-table-paging>
    </mono-card>

    <br>
    <DemoLog :lines="log" />
  </div>
</template>

<style scoped>
.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}
.example-toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 0.9rem 1rem;
}
</style>
