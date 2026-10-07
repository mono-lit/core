<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoDataDropdown } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = { OrderID: number; ShipName: string; ShipCity: string }

// The dropdown's multi-select IS the grid's check() store, so mono-table-checkbox
// works here like every other mono-table-* helper. Search first and select-all
// takes the matches only.
const PAGE_SIZE = 8

const dd = controlMonoDataDropdown<OrderRow>(null, {
  keyExpr: 'OrderID',
  displayExpr: 'ShipName',
  multiple: true,
  // OrderID is numeric — contains() on it is a 400, so it stays out of search.
  searchValue: ['ShipName', 'ShipCity'],
  pageSize: PAGE_SIZE,
})

const rows = ref<OrderRow[]>([])
const total = ref(0)
const selectedKeys = ref<Set<string>>(new Set())
const busy = ref(false)

const off = dd.subscribe(() => {
  rows.value = [...dd.table.items]
  total.value = dd.table.totalCount
  selectedKeys.value = new Set((Array.isArray(dd.value) ? dd.value : []).map(String))
  busy.value = dd.selectAllPending // mirrors check().pending
})

const selected = ref<number[]>([])


onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'ShipName', 'ShipCity'],
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
    <mono-dropdown-table
      :control-data-dropdown.prop="dd"
      label="Orders"
      placeholder="Pick orders…"
      clearable
      multiple
      :max-visible="3"
      color="secondary"
      :dropdown.prop="{ width: 460, maxHeight: 320 }"
      :model-value.prop="selected"
      @change="selected = $event.detail.modelValue"
    >
      <mono-table-search
        :control-table.prop="dd.table"
        slot="search"
        placeholder="Search ship name or city…"
      />

      <table mono-table>
        <thead>
          <tr>
            <th style="width: 2.6rem; text-align: center">
              <!-- Drains the server; spinner + indeterminate come with it. -->
              <mono-table-checkbox
                type="all"
                mode="all"
                :control-table.prop="dd.table"
                size="sm"
                aria-label-text="Select every order on the server"
              />
            </th>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="ShipName" caption="Ship to" :sort.prop="{ order: 'asc' }">Ship to</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="ShipCity" caption="City" sort>City</mono-table-th>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.OrderID" :data-row-key="String(r.OrderID)">
            <td style="text-align: center">
              <mono-table-checkbox :control-table.prop="dd.table" :item.prop="r" size="sm" />
            </td>
            <td>{{ r.ShipName }}</td>
            <td>{{ r.ShipCity }}</td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="dd.table" slot="footer" simple />
    </mono-dropdown-table>

    <p class="example-value">
      <mono-chip size="xs" :color="selectedKeys.size ? 'primary' : 'neutral'" variant="soft">
        {{ selectedKeys.size }} of {{ total }} selected
      </mono-chip>
      <mono-chip v-if="busy" size="xs" color="warning" variant="soft">draining…</mono-chip>
    </p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 460px;
}
.example-value {
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
