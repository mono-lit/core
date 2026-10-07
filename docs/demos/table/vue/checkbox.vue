<!--
  <mono-table-checkbox> — row selection that knows about the grid.

  Two jobs, chosen with `type`:

    type="all"     the select-all. In mode="all" (default) checking it DRAINS the
                   server in `chunk`-sized requests and selects every row the
                   active search/filter matches — including rows never fetched for
                   display, which is the whole point. mode="per-page" selects the
                   loaded page with no request at all.
    type="single"  (default) one row's checkbox. Give it the row: :item.prop="row".

  A <th> checkbox canNOT render the <td> ones — the library never renders your
  <tbody>, you loop the rows yourself — so both are declared below. The row one
  needs only :item.prop.

  `key-value` is what check().getAll() projects each selected row down to. It is
  path-aware and SHAPE-PRESERVING:

    key-value="OrderID"                          → [{ OrderID: 8 }, { OrderID: 12 }]
    :key-value.prop="['OrderID','ShipName']"     → [{ OrderID: …, ShipName: '…' }]
    "Company.Name"                              → [{ Company: { Name: 'Hey' } }]
    "Transaction.[*].Id"                        → [{ Transaction: [{ Id: 4 }] }]

  omit it and you get whole rows. When every path is wildcard-free the drain also
  narrows the query to those columns ($select=OrderID) — 50k ids instead of 50k records.

  The selection is keyed by the row key, so it SURVIVES paging, sorting, searching
  and filtering; only Clear (or unchecking) empties it. Search first, then select
  all, and the count matches the filtered total.

  Appearance is `mono-checkbox`'s: size / color / disabled / label all behave the
  same because the element renders the same classes.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import { controlMonoTable, type MonoCheckMode } from '@mono-lit/helper'
import type { ChipColor } from '@mono-lit/helper/ui/chip'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = {
  OrderID: number
  CustomerID: string
  ShipName: string
  ShipCountry: string
  ShipCity: string
  Freight: number
}

const ODATA_BASE = 'https://services.odata.org/V4/Northwind/Northwind.svc'

const table = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  searchValue: ['ShipName', 'ShipCity', 'CustomerID'],
  // Declared centrally so the header and the row checkboxes can't disagree.
  //
  // `mode` is deliberately NOT here: controller props WIN over what an element
  // declares and are re-applied on every update, so a key listed here can't also
  // be bound per-element — the controller would overwrite the binding a microtask
  // later. This demo switches `mode` live, so the element owns it.
  props: {
    checkbox: { keyValue: 'OrderID', chunk: 100, size: 'lg' },
  },
})

// `shallowRef`, not `ref`: a deep reactive proxy around a DataSource breaks
// devextreme's internals.
const dataSource = shallowRef<any>(null)

const rows = ref<OrderRow[]>([])
const loading = ref(false)
const checkedCount = ref(0)
const checkedSample = ref<unknown[]>([])
const pending = ref(false)
const mode = ref<MonoCheckMode>('all')

const off = table.subscribe(() => {
  rows.value = [...table.items]
  loading.value = table.loading
  const check = table.check()
  checkedCount.value = check.count()
  pending.value = check.pending
  // Only the first few — 12k ids would flood the panel.
  checkedSample.value = check.getAll().slice(0, 4)
})

onMounted(async () => {
  const { dataSource: ds } = await monoCreateFetcher({
    baseUrl: ODATA_BASE,
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'CustomerID', 'ShipName', 'ShipCountry', 'ShipCity', 'Freight'],
      paginate: true,
      pageSize: 8,
    },
  })

  dataSource.value = ds
  table.bind(ds)
  await table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** Shipping-cost band → chip colour. */
const freightColor = (freight: number): ChipColor =>
  (freight ?? 0) >= 100 ? 'danger' : (freight ?? 0) >= 40 ? 'warning' : 'success'

/** What `check().getAll()` returns, trimmed for display. */
const preview = computed(() => {
  if (!checkedCount.value) return '(nothing selected)'
  const shown = JSON.stringify(checkedSample.value)
  return checkedCount.value > checkedSample.value.length
    ? `${shown.slice(0, -1)}, … ${checkedCount.value - checkedSample.value.length} more]`
    : shown
})
</script>

<template>
  <mono-card bordered width="100%" class="example-cb-card">
    <div class="example-cb-toolbar">
      <mono-table-search :control-table.prop="table" placeholder="Search ship name, city, customer…" />

      <div class="example-cb-toolbar-right">
        <DemoSelect
          v-model="mode"
          label="mode"
          :options="[
            { value: 'all', label: 'all (drains the server)' },
            { value: 'per-page', label: 'per-page (no request)' },
          ]"
        />

        <mono-button size="sm" variant="outline" color="secondary" @click="table.check().clear()">
          Clear
        </mono-button>
      </div>
    </div>

    <div class="example-cb-status">
      <mono-chip size="xs" :color="checkedCount ? 'primary' : 'neutral'" variant="soft">
        {{ checkedCount }} selected
      </mono-chip>
      <mono-chip v-if="pending" size="xs" color="warning" variant="soft">draining…</mono-chip>
      <code class="example-cb-preview">table.check().getAll() → {{ preview }}</code>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <caption><mono-table-loading :control-table.prop="table" /></caption>

        <thead>
          <tr>
            <th class="example-cb-col">
              <!-- The select-all. `key-value` / `mode` / `chunk` come from
                   props.checkbox above; `mode` is bound here only so the demo
                   can switch it live. -->
              <mono-table-checkbox
                type="all"
                :control-table.prop="table"
                :mode="mode"
                aria-label-text="Select all rows"
              />
            </th>
            <th>
              <mono-table-th :control-table.prop="table" field="OrderID" caption="Order" sort>Order</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="table" field="ShipName" caption="Ship to" sort>Ship to</mono-table-th>
            </th>
            <th>Country</th>
            <th>City</th>
            <th class="example-num">Freight</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.OrderID" :data-row-key="row.OrderID">
            <td class="example-cb-col">
              <mono-table-checkbox :control-table.prop="table" :item.prop="row" />
            </td>
            <td>{{ row.OrderID }}</td>
            <td>{{ row.ShipName }}</td>
            <td>{{ row.ShipCountry }}</td>
            <td>
              <mono-chip size="xs" :color="freightColor(row.Freight)" variant="soft">
                {{ row.ShipCity }}
              </mono-chip>
            </td>
            <td class="example-num">{{ usd.format(row.Freight ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-show="!rows.length && !loading" mono-table-empty>
      <div mono-empty-title>No orders found</div>
      <div mono-empty-sub>Try a different search.</div>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-cb-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-cb-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-cb-toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.example-cb-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0 1rem 0.72rem;
}

.example-cb-preview {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  word-break: break-all;
}

/* The checkbox column only needs to fit the box. */
.example-cb-col {
  width: 2.75rem;
  text-align: center;
}

.example-num {
  text-align: right;
  white-space: nowrap;
}
</style>
