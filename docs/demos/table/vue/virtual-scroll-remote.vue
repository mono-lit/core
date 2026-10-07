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

const ROW_HEIGHT = 44

// Remote virtual scroll: only the height-visible rows render, and the server is
// paged (skip/take) as the window nears the loaded end — so a big OData table
// stays light in both the DOM and the network.
const table = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  searchValue: ['ShipName', 'ShipCity', 'CustomerID'],
})

const rows = ref<OrderRow[]>([]) // windowed slice
const padTop = ref(0)
const padBottom = ref(0)
const loaded = ref(0)
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// Page-size override: the DataSource above requests pageSize 50; `<mono-table-paging :size>`
// wins over it. "auto" leaves :size unset → the DataSource's own 50 is used.
const pageSizeSel = ref('20') // default 20 (overrides the DataSource's 50)
const pageSize = computed<number | undefined>(() =>
  pageSizeSel.value === 'auto' ? undefined : Number(pageSizeSel.value),
)

const off = table.subscribe(() => {
  rows.value = [...table.items]
  padTop.value = table.virtualPadTop
  padBottom.value = table.virtualPadBottom
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
      pageSize: 50, // server page fetched as the window advances
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
      <DemoSelect v-model="pageSizeSel" label="Page size" :options="[{ value: 'auto', label: 'Auto (DataSource · 50)' }, '10', '20', '50', '100']" />
      <span class="example-count"><strong>{{ rows.length }}</strong> in DOM · {{ loaded }} loaded</span>
    </div>

    <div mono-table-scroll mono-sticky-head mono-scroll-y class="example-scroll">
      <table mono-table class="example-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Ship to</th>
            <th>Country</th>
            <th class="example-num">Freight</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="padTop" :style="{ height: padTop + 'px' }" aria-hidden="true"><td colspan="4"></td></tr>
          <tr v-for="row in rows" :key="row.OrderID">
            <td class="example-doc">{{ row.OrderID }}</td>
            <td>{{ row.ShipName }}</td>
            <td><mono-chip size="xs" color="info" variant="soft">{{ row.ShipCountry }}</mono-chip></td>
            <td class="example-num">{{ usd.format(row.Freight || 0) }}</td>
          </tr>
          <tr v-if="padBottom" :style="{ height: padBottom + 'px' }" aria-hidden="true"><td colspan="4"></td></tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="table" type="virtual-scroll" :row-height="ROW_HEIGHT" :size.prop="pageSize" />
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
  opacity: 0.75;
  font-family: 'DM Mono', ui-monospace, monospace;
}
.example-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.example-doc { white-space: nowrap; font-variant-numeric: tabular-nums; }
.example-scroll {
  overflow-y: auto !important;
  max-height: 400px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.example-scroll :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card);
}
.example-table :deep(tbody td) {
  height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  box-sizing: border-box;
}
</style>
