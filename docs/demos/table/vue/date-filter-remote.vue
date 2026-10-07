<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = {
  OrderID: number
  ShipCountry: string
  OrderDate: Date | string | null
  ShippedDate: Date | string | null
}

// Northwind Orders (830 rows, 1996–1998). One `$select=OrderDate` scan per open
// (Northwind rejects `$apply`); a tick sends `OrderDate ge … and OrderDate lt …`.
// No `utc`: DevExtreme reads `…T00:00:00Z` as local midnight and writes it back
// the same way, so the local tree already matches the server's days.
const table = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  props: {
    th: [
      { field: 'ShipCountry', caption: 'Country', headerFilter: true, sort: true },
      { field: 'OrderDate', caption: 'Ordered', dateFilter: true, sort: true },
      { field: 'ShippedDate', caption: 'Shipped', dateFilter: { depth: 'day' }, sort: true },
    ],
  },
})

const rows = ref<OrderRow[]>([])
const loading = ref(false)

const off = table.subscribe(() => {
  rows.value = [...table.items]
  loading.value = table.loading
})

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'ShipCountry', 'OrderDate', 'ShippedDate'],
      paginate: true,
      pageSize: 8,
      requireTotalCount: true,
    },
  })

  table.bind(dataSource)
  await table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})

// DevExtreme deserialises OData dates into Date objects.
const day = (v: Date | string | null) => {
  if (!v) return '—'
  if (!(v instanceof Date)) return String(v).slice(0, 10)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`
}
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">Orders (Northwind)</strong>
      <span class="example-hint">Funnel on Ordered (years → months) or Shipped (down to days), from the live service.</span>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <caption><mono-table-loading :control-table.prop="table" /></caption>
        <thead>
          <tr>
            <th>Order</th>
            <th><mono-table-th :control-table.prop="table" field="ShipCountry" /></th>
            <th><mono-table-th :control-table.prop="table" field="OrderDate" /></th>
            <th><mono-table-th :control-table.prop="table" field="ShippedDate" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.OrderID">
            <td>{{ row.OrderID }}</td>
            <td>{{ row.ShipCountry }}</td>
            <td>{{ day(row.OrderDate) }}</td>
            <td>{{ day(row.ShippedDate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-show="!rows.length && !loading" mono-table-empty>
      <div mono-empty-title>No orders match</div>
      <div mono-empty-sub>Clear a column filter.</div>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-hint {
  font-size: 0.78rem;
  color: var(--foreground);
  opacity: 0.7;
}
</style>
