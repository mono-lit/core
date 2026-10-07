<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = {
  OrderID: number
  CustomerID: string
  ShipName: string
  ShipCountry: string
  ShipCity: string
  Freight: number
}

// Same accumulator, but every appended page is a real OData round-trip
// (skip/take) — scroll to the bottom and the next server page loads & appends.
const table = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  searchValue: ['ShipName', 'ShipCity', 'CustomerID'],
})

const rows = ref<OrderRow[]>([])
const loaded = ref(0)
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// `:size` on the pager overrides the DataSource's pageSize (40 below). "auto" clears it.
const pageSizeSel = ref('20')
const pageSize = computed<number | undefined>(() =>
  pageSizeSel.value === 'auto' ? undefined : Number(pageSizeSel.value),
)

const off = table.subscribe(() => {
  rows.value = [...table.items]
  loaded.value = table.loadedCount
})

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'CustomerID', 'ShipName', 'ShipCountry', 'ShipCity', 'Freight'],
      paginate: true,
      pageSize: 40, // rows fetched per scroll-to-end
    },
  })
  table.bind(dataSource)
  await table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <div style="width: 100%;">
    <div class="example-toolbar">
      <mono-table-search :control-table.prop="table" placeholder="Search ship name, city, customer…" />
      <DemoSelect v-model="pageSizeSel" label="Page size" :options="[{ value: 'auto', label: 'Auto (DataSource · 40)' }, '10', '20', '50', '100']" />
      <span class="example-count">{{ loaded }} loaded (server)</span>
    </div>

    <!-- The pager sits INSIDE the fixed-height scroll region so it drives it. -->
    <div mono-table-scroll mono-sticky-head mono-scroll-y class="example-scroll">
      <table mono-table>
        <thead>
          <tr>
            <th><mono-table-sort :control-table.prop="table" field="OrderID">Order</mono-table-sort></th>
            <th><mono-table-sort :control-table.prop="table" field="ShipName">Ship to</mono-table-sort></th>
            <th>Country</th>
            <th class="example-num"><mono-table-sort :control-table.prop="table" field="Freight">Freight</mono-table-sort></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.OrderID">
            <td class="example-doc">{{ row.OrderID }}</td>
            <td>{{ row.ShipName }}</td>
            <td><mono-chip size="xs" color="info" variant="soft">{{ row.ShipCountry }}</mono-chip></td>
            <td class="example-num">{{ usd.format(row.Freight || 0) }}</td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="table" type="infinity-scroll" :size.prop="pageSize" />
    </div>
  </div>
</template>

<style scoped>
.example-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}
.example-toolbar mono-table-search { margin-right: auto; }
.example-count {
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.7;
  font-family: 'DM Mono', ui-monospace, monospace;
}
.example-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.example-doc { white-space: nowrap; font-variant-numeric: tabular-nums; }
.example-scroll {
  overflow-y: auto !important;
  max-height: 360px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.example-scroll :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card);
}
</style>
