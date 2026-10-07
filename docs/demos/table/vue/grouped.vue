<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import { controlMonoTable, type MonoDisplayRow } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = { OrderID: number; ShipName: string; ShipCountry: string; ShipCity: string }

const rows = ref<MonoDisplayRow<OrderRow>[]>([])
const loading = ref(false)
let table: ReturnType<typeof controlMonoTable<OrderRow>>
let off: () => void

onMounted(async () => {
  // Multi-level grouping (ShipCountry → ShipCity) over a small DataSource:
  // grouped + paged in memory. The main pager pages the first layer
  // (ShipCountry). `table.displayRows` gives the flattened, keyed rows — no
  // tree walking in the component.
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'ShipName', 'ShipCountry', 'ShipCity'],
      // One page of orders is plenty to build a two-level tree from, and keeps
      // the in-memory grouping small.
      paginate: true,
      pageSize: 60,
    },
  })

  table = controlMonoTable<OrderRow>(dataSource, {
    keyExpr: 'OrderID',
    group: ['ShipCountry', 'ShipCity'],
    pageSize: 4, // top-level (ShipCountry) groups per page
    searchValue: ['ShipName', 'ShipCity'],
  })

  off = table.subscribe(() => {
    rows.value = table.displayRows
    loading.value = table.loading
  })
  await table.load()
})

onBeforeUnmount(() => {
  off?.()
  table?.dispose()
})
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">Orders — paged by group</strong>

      <div class="example-toolbar-right">
        <mono-button size="xs" variant="ghost" @click="table?.expandAllGroups()">Expand all</mono-button>
        <mono-button size="xs" variant="ghost" @click="table?.collapseAllGroups()">Collapse all</mono-button>
        <mono-table-search :control-table.prop="table" placeholder="Search ship name or city…" />
      </div>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th><mono-table-sort :control-table.prop="table" field="OrderID">Order</mono-table-sort></th>
            <th><mono-table-sort :control-table.prop="table" field="ShipCity">City</mono-table-sort></th>
            <th><mono-table-sort :control-table.prop="table" field="ShipName">Ship to</mono-table-sort></th>
          </tr>
        </thead>

        <tbody>
          <template v-for="item in rows" :key="item.key">
            <tr
              v-if="item.kind === 'group'"
              mono-group-row
              @click="table.toggleGroup(item.node!)"
            >
              <td colspan="3" mono-group-cell :style="{ '--mono-table-group-level': item.level }">
                <button
                  type="button"
                  mono-group-toggle
                  :data-collapsed="item.node!.collapsed ? '' : undefined"
                >
                  <span mono-group-caret aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </span>
                  <span mono-group-key>{{ item.node!.key }}</span>
                  <span mono-group-count>({{ item.node!.count }})</span>
                </button>
              </td>
            </tr>

            <tr v-else>
              <td>{{ item.row!.OrderID }}</td>
              <td><mono-chip size="xs" color="primary" variant="soft">{{ item.row!.ShipCity }}</mono-chip></td>
              <td>{{ item.row!.ShipName }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="!rows.length" mono-table-empty>
      <div mono-empty-title>{{ loading ? 'Loading…' : 'No orders found' }}</div>
      <div v-if="!loading" mono-empty-sub>Try a different search.</div>
    </div>

    <div mono-table-foot>
      <div class="example-footer-left">
        <mono-table-page-size :control-table.prop="table" :sizes.prop="[4, 8, 'all']" label="Groups:" />
        <mono-table-info :control-table.prop="table" template="Showing {from}–{to} of {total} groups" />
      </div>
      <mono-table-paging :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-card { --mono-card-padding: 0; width: 100%; overflow: hidden; }
.example-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; padding: 0.72rem 1rem; flex-wrap: wrap;
}
.example-toolbar-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.example-title { font-size: 0.9rem; color: var(--foreground); }
.example-footer-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
@media (max-width: 640px) {
  .example-toolbar { align-items: stretch; }
  .example-toolbar-right mono-table-search { max-width: 100%; }
}
</style>
