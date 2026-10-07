<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = {
  OrderID: number
  ShipName: string
  ShipCountry: string
  ShipCity: string
}

// Funnel = single column (replaces). Right-click → Header Filter › = combine.
// Northwind rejects `$apply`, so the list is a `$select` scan (remembered).
const table = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  // NOT OrderID — it is numeric, and contains() on a number is a 400.
  searchValue: ['ShipName', 'ShipCity'],
  props: {
    th: [
      { field: 'ShipCountry', caption: 'Country', sort: true, headerFilter: true },
      { field: 'ShipCity', caption: 'City', sort: { order: 'asc' }, headerFilter: true },
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
      select: ['OrderID', 'ShipName', 'ShipCountry', 'ShipCity'],
      paginate: true,
      pageSize: 8,
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
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">Orders</strong>
      <span class="example-hint">Click a funnel for one column; right-click a header to combine.</span>
      <mono-table-search :control-table.prop="table" placeholder="Search ship name or city…" />
    </div>

    <!-- The wrapper is never hidden when `rows` is empty: filtering down to zero
         rows would take the header — and the funnels — away, leaving no way out. -->
    <div mono-table-scroll>
      <table mono-table>
        <caption><mono-table-loading :control-table.prop="table" /></caption>

        <thead>
          <tr>
            <th>Order</th>
            <th>Ship to</th>
            <th><mono-table-th :control-table.prop="table" field="ShipCountry" /></th>
            <th><mono-table-th :control-table.prop="table" field="ShipCity" /></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.OrderID">
            <td>{{ row.OrderID }}</td>
            <td>{{ row.ShipName }}</td>
            <td>{{ row.ShipCountry }}</td>
            <td>{{ row.ShipCity }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-show="!rows.length && !loading" mono-table-empty>
      <div mono-empty-title>No orders match</div>
      <div mono-empty-sub>Clear a column filter or the search box.</div>
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
