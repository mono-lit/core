<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import { controlMonoTable } from '@mono-lit/helper'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PRODUCTS = [
  'Keyboard', 'Mouse', 'Monitor', 'Dock', 'Cable', 'Webcam',
  'Headset', 'Stand', 'Laptop', 'Charger', 'Router', 'Speaker',
]

type Row = { Id: number; Item: string; [month: string]: number | string }

// Many rows (products × batches) so the body scrolls vertically under the totals.
const DATA: Row[] = []
let id = 1
for (const batch of ['A', 'B', 'C', 'D']) {
  PRODUCTS.forEach((name, i) => {
    const row: Row = { Id: id, Item: `${name} ${batch}` }
    MONTHS.forEach((m, j) => {
      row[m] = ((id + i + 2) * (j + 3) * 7) % 380 + 20
    })
    DATA.push(row)
    id++
  })
}

const columns = [
  { field: 'Item', caption: 'Item', sticky: true, width: '150px' },
  ...MONTHS.map((m) => ({ field: m, caption: m, sticky: false, width: '72px' })),
]

const table = controlMonoTable<Row>(DATA, {
  searchValue: ['Item'],
  // Show every row (no pagination) so the whole list scrolls vertically inside
  // the fixed-height region — the array source otherwise pages at 10 rows.
  pageSize: DATA.length,
  summary: {
    recalculate: { searching: false, changedData: true },
    fields: Object.fromEntries(MONTHS.map((m) => [m, { type: 'sum' as const }])),
  },
})

const rows = ref<Row[]>([])
const off = table.subscribe(() => {
  rows.value = [...table.items]
})
void table.load()

const hasSummary = (field: string) => table.summary().get(field) != null

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong>Monthly units</strong>
      <mono-table-search :control-table.prop="table" placeholder="Filter products…" />
    </div>

    <p class="example-hint">
      The totals <strong>&lt;tfoot&gt;</strong> stays pinned at the bottom: scroll ↕ and the
      rows slide under it, scroll ↔ and the <strong>Item</strong> column (and its Totals cell)
      stays pinned.
    </p>

    <!-- mono-scroll-y + max-height = the vertical scroll region the sticky header and
         footer pin against; the table's own width overflows → horizontal scroll. -->
    <div mono-table-scroll mono-scroll-y class="example-scroll">
      <table mono-table mono-sticky-head mono-sticky-foot class="example-table">
        <thead>
          <tr>
            <th
              v-for="c in columns"
              :key="c.field"
              :mono-sticky-left="c.sticky ? '' : null"
            >
              <mono-table-th
                :control-table.prop="table"
                :field="c.field"
                :caption="c.caption"
                sort
                :width="c.width"
              >
                {{ c.caption }}
              </mono-table-th>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td
              v-for="c in columns"
              :key="c.field"
              :mono-sticky-left="c.sticky ? '' : null" :class="{ 'example-num': !c.sticky }"
            >
              {{ row[c.field] }}
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <!-- Frozen totals row, looped from the SAME columns → aligned, and the
                 pinned Item cell stays put on horizontal scroll. -->
            <td
              v-for="c in columns"
              :key="c.field"
              :mono-sticky-left="c.sticky ? '' : null" :class="{ 'example-num': !c.sticky }"
            >
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

.example-hint {
  margin: 0;
  padding: 0 1rem 0.6rem;
  font-size: 0.8rem;
  opacity: 0.65;
}

.example-scroll {
  max-height: 340px;
}

/* Wide enough to overflow horizontally: Item 150px + 12 × 72px ≈ 63rem. */
.example-card :deep(.example-table) {
  min-width: 64rem;
}

.example-card :deep(.example-num) {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Room under the totals for the horizontal scrollbar sharing the bottom edge
   (overlay scrollbars draw over content) — the sheet's own knob for exactly
   that, rather than a rule reaching into the footer cells. */
.example-scroll {
  --mono-table-foot-scrollbar: 0.5rem;
}
</style>
