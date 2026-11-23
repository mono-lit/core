<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = { OrderID: number; CustomerID: string; ShipCountry: string; ShipCity: string; Freight: number }

const ROW_HEIGHT = 36
const table = controlMonoTable<OrderRow>(null, { keyExpr: 'OrderID', searchValue: ['ShipCountry', 'ShipCity', 'CustomerID'] })

// Country bands, City bands inside. Read in chunks of 100 — the first request carries $count.
const grouped = {
  chunk: 100,
  open: false,
  stayOpen: false,
  fields: [
    { field: 'ShipCountry', color: 'primary' },
    { field: 'ShipCity', variant: 'text' as const, color: 'neutral' },
  ],
}

const rows = ref<OrderRow[]>([])
const padTop = ref(0)
const padBottom = ref(0)
const total = ref(0)
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const off = table.subscribe(() => {
  rows.value = [...table.items]
  padTop.value = table.virtualPadTop
  padBottom.value = table.virtualPadBottom
  total.value = table.totalCount
})

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: { key: 'OrderID', select: ['OrderID', 'CustomerID', 'ShipCountry', 'ShipCity', 'Freight'] },
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
      <mono-table-search :control-table.prop="table" placeholder="Search country, city, customer…" />
      <span class="example-count">{{ total }} orders</span>
    </div>

    <div mono-table-scroll mono-sticky-head mono-scroll-y class="example-scroll">
      <table mono-table class="example-table">
        <caption><mono-table-loading :control-table.prop="table" /></caption>
        <thead>
          <tr>
            <th><mono-table-th :control-table.prop="table" field="OrderID" caption="Order" :sort.prop="true" :grouped.prop="grouped" /></th>
            <th><mono-table-th :control-table.prop="table" field="CustomerID" caption="Customer" :sort.prop="true" /></th>
            <th><mono-table-th :control-table.prop="table" field="ShipCity" caption="City" :sort.prop="true" /></th>
            <th><mono-table-th :control-table.prop="table" field="Freight" caption="Freight" align="right" :sort.prop="true" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="padTop" :style="{ height: padTop + 'px' }" aria-hidden="true"><td colspan="4"></td></tr>
          <tr v-for="row in rows" :key="row.OrderID">
            <td>{{ row.OrderID }}</td>
            <td>{{ row.CustomerID }}</td>
            <td>{{ row.ShipCity }}</td>
            <td style="text-align: right;">{{ usd.format(row.Freight) }}</td>
          </tr>
          <tr v-if="padBottom" :style="{ height: padBottom + 'px' }" aria-hidden="true"><td colspan="4"></td></tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="table" type="virtual-scroll" :row-height="ROW_HEIGHT" :overscan="10" />
    </div>
  </div>
</template>

<style scoped>
.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.6rem;
}
.example-count {
  font-size: 0.8rem;
  opacity: 0.75;
  font-family: 'DM Mono', ui-monospace, monospace;
}
.example-scroll {
  overflow-y: auto !important;
  max-height: 420px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.example-table :deep(tbody td) {
  height: 36px;
  padding-top: 0;
  padding-bottom: 0;
  box-sizing: border-box;
  white-space: nowrap;
}
</style>
