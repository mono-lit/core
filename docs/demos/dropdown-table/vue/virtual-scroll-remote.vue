<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoDataDropdown } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = { OrderID: number; CustomerID: string; ShipName: string; ShipCity: string }

// Must match `row-height` below AND the pinned CSS height on the data cells.
const ROW_HEIGHT = 36
// Bigger server pages than infinity mode: virtual scrolling can jump far, so each
// fetch should cover a good stretch of the scrollbar.
const PAGE_SIZE = 50

const dd = controlMonoDataDropdown<OrderRow>(null, {
  keyExpr: 'OrderID',
  displayExpr: 'ShipName',
  // OrderID is numeric — contains() on it is a 400, so it stays out of search.
  searchValue: ['ShipName', 'ShipCity', 'CustomerID'],
  pageSize: PAGE_SIZE,
})

// `grid.items` is the windowed slice; the spacers come from the controller.
const rows = ref<OrderRow[]>([])
const padTop = ref(0)
const padBottom = ref(0)
const loaded = ref(0)
const total = ref(0)
const off = dd.table.subscribe(() => {
  rows.value = [...dd.table.items]
  padTop.value = dd.table.virtualPadTop
  padBottom.value = dd.table.virtualPadBottom
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
      clearable color="secondary" helper-text="Windowed rows over a remote OData source."
      :dropdown.prop="{ width: 440, maxHeight: 300 }"
      :model-value="selected" @change="selected = $event.detail.modelValue">
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search ship name, city, customer…" />

      <table mono-table>
        <thead>
          <tr>
            <th>City</th>
            <th>Ship to</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="padTop" :style="{ height: padTop + 'px' }" aria-hidden="true">
            <td colspan="2"></td>
          </tr>

          <tr v-for="r in rows" :key="r.OrderID" class="example-vs-row" :data-row-key="String(r.OrderID)">
            <td>
              <mono-chip size="xs" color="primary" variant="soft">{{ r.ShipCity }}</mono-chip>
            </td>
            <td>{{ r.ShipName }}</td>
          </tr>

          <tr v-if="padBottom" :style="{ height: padBottom + 'px' }" aria-hidden="true">
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="dd.table" type="virtual-scroll" :row-height="ROW_HEIGHT" />
    </mono-dropdown-table>

    <p class="example-value">
      Selected id: <strong>{{ selected ?? '—' }}</strong> ·
      <strong>{{ rows.length }}</strong> rows in DOM · {{ loaded }} / {{ total }} loaded
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
/* Pin DATA rows to exactly ROW_HEIGHT (spacers keep their computed height). */
.example-vs-row td {
  height: 36px;
  padding-top: 0;
  padding-bottom: 0;
  box-sizing: border-box;
}
</style>
