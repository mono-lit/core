<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoDataDropdown } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = { OrderID: number; CustomerID: string; ShipName: string; ShipCity: string }

// Remote OData source. Each scroll to the bottom fetches the NEXT server page and
// appends it to the accumulator — the panel never refetches what it already has.
const PAGE_SIZE = 20

const dd = controlMonoDataDropdown<OrderRow>(null, {
  keyExpr: 'OrderID',
  displayExpr: 'ShipName',
  // OrderID is numeric — contains() on it is a 400, so it stays out of search.
  searchValue: ['ShipName', 'ShipCity', 'CustomerID'],
  pageSize: PAGE_SIZE,
})

const rows = ref<OrderRow[]>([])
const loaded = ref(0)
const total = ref(0)
const off = dd.table.subscribe(() => {
  rows.value = [...dd.table.items]
  loaded.value = dd.table.loadedCount
  total.value = dd.table.totalCount
})

const selected = ref<number | null>(null)

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'CustomerID', 'ShipName', 'ShipCity'],
      paginate: true,
      pageSize: PAGE_SIZE,
    },
  })
  dd.bind(dataSource)
  await dd.table.load()
})

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <mono-dropdown-table :control-data-dropdown.prop="dd" label="Order" placeholder="Pick an order…"
      clearable color="secondary" helper-text="Scrolling fetches the next server page."
      :dropdown.prop="{ width: 440, maxHeight: 300 }"
      :model-value="selected" @change="selected = $event.detail.modelValue">
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search ship name, city, customer…" />

      <!-- Sorting or searching re-seeds the accumulator from page 0 — the server
           decides the new order, so the buffer can't just be re-sorted in place. -->
      <table mono-table>
        <thead>
          <tr>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="ShipCity" caption="City" sort>City</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="ShipName" caption="Ship to" :sort.prop="{ order: 'asc' }">Ship to</mono-table-th>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.OrderID" :data-row-key="String(r.OrderID)">
            <td>
              <mono-chip size="xs" color="primary" variant="soft">{{ r.ShipCity }}</mono-chip>
            </td>
            <td>{{ r.ShipName }}</td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="dd.table" type="infinity-scroll" />
    </mono-dropdown-table>

    <p class="example-value">
      Selected id: <strong>{{ selected ?? '—' }}</strong> · {{ loaded }} / {{ total }} loaded
    </p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 440px;
}
.example-value {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--background);
}
</style>
