<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import { controlMonoTable } from '@mono-lit/helper'
import type { MonoSummaryResult } from '@mono-lit/helper'

type OrderRow = { Id: number; Item: string; Qty: number; Price: number }

const DATA: OrderRow[] = [
  { Id: 1, Item: 'Keyboard', Qty: 3, Price: 45 },
  { Id: 2, Item: 'Mouse', Qty: 5, Price: 25 },
  { Id: 3, Item: 'Monitor', Qty: 2, Price: 210 },
  { Id: 4, Item: 'Dock', Qty: 4, Price: 130 },
  { Id: 5, Item: 'Cable', Qty: 12, Price: 9 },
  { Id: 6, Item: 'Webcam', Qty: 3, Price: 75 },
  { Id: 7, Item: 'Headset', Qty: 6, Price: 60 },
  { Id: 8, Item: 'Stand', Qty: 8, Price: 35 },
]

// One column list drives the header, the body AND the summary footer — no
// per-cell duplication.
const columns = [
  { field: 'Item', caption: 'Item', cell: (r: OrderRow) => r.Item },
  { field: 'Qty', caption: 'Qty', cell: (r: OrderRow) => String(r.Qty) },
  { field: 'Price', caption: 'Price', cell: (r: OrderRow) => `$${r.Price}` },
]

// Aggregates ride along with the column that owns them, in `props.th`.
// `recalculate` is table-wide, so it stays on `summary` — `searching: false`
// keeps the totals showing the WHOLE dataset even while the search narrows it.
const table = controlMonoTable<OrderRow>(DATA, {
  searchValue: ['Item'],
  summary: { recalculate: { searching: false, changedData: true } },
  props: {
    th: [
      { field: 'Item', caption: 'Item', sort: true },
      { field: 'Qty', caption: 'Qty', sort: true, summary: { type: 'sum' } },
      { field: 'Price', caption: 'Price', sort: true, summary: { type: 'sum', prefix: '$', precision: 2 } },
    ],
  },
})

const rows = ref<OrderRow[]>([])
const totals = ref<MonoSummaryResult[]>([])

const off = table.subscribe(() => {
  rows.value = [...table.items]
  // getAll() exposes every result — loop it to render totals anywhere.
  totals.value = table.summary().getAll()
})
void table.load()

// Does this column have a configured summary? (get() is null when it doesn't.)
const hasSummary = (field: string) => table.summary().get(field) != null

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong>Orders</strong>
      <mono-table-search :control-table.prop="table" placeholder="Filter items…" />
    </div>

    <!-- Loop table.summary().getAll() (field is on every result) as stat chips. -->
    <div class="example-stats">
      <mono-chip
        v-for="t in totals"
        :key="t.field + t.type"
        size="xs"
        color="primary"
        variant="soft"
      >
        {{ t.field }} · {{ t.type }}: {{ t.text }}
      </mono-chip>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <!-- caption + sort come from props.th; the cell needs only its field -->
            <th v-for="c in columns" :key="c.field">
              <mono-table-th :control-table.prop="table" :field="c.field" />
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td v-for="c in columns" :key="c.field">{{ c.cell(row) }}</td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <!-- summary cells looped too: one <mono-table-summary> per column
                 that has a summary, aligned by looping the SAME columns. -->
            <td v-for="c in columns" :key="c.field">
              <mono-table-summary
                v-if="hasSummary(c.field)"
                :control-table.prop="table"
                :field="c.field"
              />
              <span v-else>Totals</span>
            </td>
          </tr>
        </tfoot>
      </table>
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
}

.example-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0 1rem 0.72rem;
}
</style>
