<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/card'
import { controlMonoTable } from '@mono-lit/helper'
import { controlMonoForm } from '@mono-lit/helper/ui/form'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = { OrderID: number; ShipName: string; ShipCity: string; ShipCountry: string }

// Same scenario as the grid-driven demo, but the SEARCH is the page's own:
// `:model-value` + `@input` make mono-table-search a plain controlled field, and
// the page filters the table itself (debounced, through `table.setFilter`).
//
// The filter suggestion still works: in manual mode it probes the box's own text.
// Give it `searchValue` = the fields YOUR search covers, so its count matches the
// query you actually sent.
//
// The countries THIS user may pick. Only these are ever suggested:
//   • "hanari" → its orders ship to Brazil, which IS listed → "Adjust Filter" offered.
//   • "ernst"  → its orders all ship to Austria, which is NOT listed → no suggestion.
const COUNTRIES = [
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'UK' },
]

const form = controlMonoForm({
  inputs: {
    Country: {
      component: 'mono-select',
      value: 'Germany',
      props: { items: COUNTRIES, keyValue: 'value', displayValue: 'label' },
    },
  },
})

// The form is the base filter (read on every query); the page's search is a
// separate layer, written with `setFilter` below.
const table = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  dataSourceOptions: () => {
    const country = form.values().Country
    return country ? { filter: ['ShipCountry', '=', country] } : {}
  },
})
const rows = ref<OrderRow[]>([])
const log = ref<string[]>([])
const offTable = table.subscribe(() => { rows.value = [...table.items] })

let lastCountry = form.values().Country
const offForm = form.subscribe(() => {
  const country = form.values().Country
  if (country === lastCountry) return
  lastCountry = country
  void table.refresh()
})

// ── The manual search ────────────────────────────────────────────────────────
const SEARCH_FIELDS = ['ShipName', 'ShipCity']
const q = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

function applySearch(text: string) {
  const t = text.trim()
  void table.setFilter(
    t ? [['ShipName', 'contains', t], 'or', ['ShipCity', 'contains', t]] : null,
  )
}

function onInput(e: CustomEvent) {
  q.value = e.detail.modelValue ?? ''
  // The box emits on every keystroke; the debounce is ours to choose.
  clearTimeout(timer)
  timer = setTimeout(() => applySearch(q.value), 350)
}

function onClear() {
  q.value = ''
  clearTimeout(timer)
  applySearch('')
}

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
  // The form already holds the new country; the subscription above re-queries, and
  // the search layer (setFilter) is still in place — so skip the default refresh.
  e.preventDefault()
  const d = e.detail
  log.value = [`[adjust] ${d.key}: ${d.current} → ${d.value} (${d.count} orders)`, ...log.value].slice(0, 6)
}

onBeforeUnmount(() => { clearTimeout(timer); offTable(); offForm(); table.dispose() })
</script>

<template>
  <div style="width: 100%;">
    <mono-card bordered width="100%" class="example-card">
      <div class="example-toolbar">
        <mono-select :control-form.prop="form" key-form="Country" label="Ship country" />
        <!-- Manual: :model-value + @input/@clear — the page runs the search. -->
        <mono-table-search
          :model-value="q"
          :control-table.prop="table"
          :control-form.prop="form"
          :suggestion-filter.prop="{ keys: { ShipCountry: 'Country' }, searchValue: SEARCH_FIELDS }"
          clearable
          label="Search ship name or city"
          placeholder="Try “hanari”, then “ernst”…"
          @input="onInput"
          @clear="onClear"
          data-search />
      </div>

      <div mono-table-scroll>
        <table mono-table>
          <caption>
            <mono-table-loading :control-table.prop="table"></mono-table-loading>
            <mono-table-empty
              :control-table.prop="table"
              :control-form.prop="form"
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
