<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/date'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

// Deliberately WIDE: 12 editable columns behind a horizontal scrollbar, with the
// ID column pinned. Navigating right walks the editor off-screen, so the grid has
// to scroll to follow it — and must never park it under the pinned column.
const CODES = ['AX', 'BK', 'CM', 'DR', 'EN', 'FT']
const data = ref(
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    code: `${CODES[i % CODES.length]}-${100 + i}`,
    name: ['Ada', 'Alan', 'Grace', 'Katherine', 'Edsger', 'Barbara', 'Donald', 'Margaret'][i],
    qty: (i + 1) * 3,
    price: 12.5 + i * 4,
    unit: ['box', 'kg', 'pcs'][i % 3],
    warehouse: ['north', 'south', 'central'][i % 3],
    lot: `LOT-${2200 + i}`,
    received: `2024-0${(i % 9) + 1}-1${i % 9}`,
    shipped: `2024-0${(i % 8) + 2}-2${i % 8}`,
    ref: `REF/${900 + i}`,
    note: ['restock', 'urgent', 'hold', 'checked'][i % 4],
  })),
)

const units = ref([
  { label: 'Box', value: 'box' },
  { label: 'Kg', value: 'kg' },
  { label: 'Pcs', value: 'pcs' },
])
const warehouses = ref([
  { label: 'North', value: 'north' },
  { label: 'South', value: 'south' },
  { label: 'Central', value: 'central' },
])
const labelOf = (list, v) => list.value.find((o) => o.value === v)?.label ?? v

// Every editable column, in the order they appear — drives both the <thead> and
// the per-row <td> loop so 12 columns don't become 12 copies of the same markup.
const COLUMNS = [
  { field: 'code', caption: 'Code', width: '8rem', editor: 'text' },
  { field: 'name', caption: 'Name', width: '9rem', editor: 'text' },
  { field: 'qty', caption: 'Qty', width: '6rem', editor: 'number' },
  { field: 'price', caption: 'Price', width: '7rem', editor: 'number' },
  { field: 'unit', caption: 'Unit', width: '8rem', editor: 'select', options: units },
  { field: 'warehouse', caption: 'Warehouse', width: '10rem', editor: 'select', options: warehouses },
  { field: 'lot', caption: 'Lot', width: '8rem', editor: 'text' },
  { field: 'received', caption: 'Received', width: '9.5rem', editor: 'date' },
  { field: 'shipped', caption: 'Shipped', width: '9.5rem', editor: 'date' },
  { field: 'ref', caption: 'Ref', width: '8rem', editor: 'text' },
  { field: 'note', caption: 'Note', width: '10rem', editor: 'text' },
  { field: 'tag', caption: 'Tag', width: '8rem', editor: 'text' },
]

const table = controlMonoTable(data.value, { keyExpr: 'id', pageSize: 8, editableTrigger: 'click' })

const rows = ref([])
const off = table.subscribe(() => { rows.value = [...table.items] })
table.load()

const rk = (row) => String(row.id)
const displayOf = (row, col) => {
  const v = table.cellValue(rk(row), col.field, row[col.field])
  if (col.field === 'unit') return labelOf(units, v)
  if (col.field === 'warehouse') return labelOf(warehouses, v)
  return v ?? '—'
}

// --- live readout ----------------------------------------------------------
// Where the caret is + how far the scroller has travelled, so the navigation is
// observable without watching the focus ring.
const at = ref({ row: '—', field: '—' })
const scrollLeft = ref(0)
const lastKeys = ref('—')
const scrollerEl = ref(null)

function readPosition() {
  const cell = document.activeElement?.closest?.('[data-edit-cell]')
  const row = cell?.closest?.('[data-row-key]')
  at.value = {
    row: row?.getAttribute('data-row-key') ?? '—',
    field: cell?.getAttribute('data-edit-cell') ?? '—',
  }
  scrollLeft.value = Math.round(scrollerEl.value?.scrollLeft ?? 0)
}

const tabDown = ref(false)
function onKeydown(e) {
  if (e.key === 'Tab') tabDown.value = true
  const arrow = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }[e.key]
  if (e.key === 'Tab') lastKeys.value = e.shiftKey ? 'Shift+Tab' : 'Tab'
  else if (arrow) lastKeys.value = tabDown.value ? `Tab + ${arrow}` : `${arrow} (caret)`
  else if (e.key === 'Enter') lastKeys.value = 'Enter (open editor)'
  else if (e.key === 'Escape') lastKeys.value = 'Esc'
  // One frame later the grid has moved the editor and scrolled it into view.
  requestAnimationFrame(() => requestAnimationFrame(readPosition))
}
function onKeyup(e) {
  if (e.key !== 'Tab') return
  tabDown.value = false
  requestAnimationFrame(() => requestAnimationFrame(readPosition))
}

const pending = computed(() => table.pendingCount())

onBeforeUnmount(() => { off(); table.dispose() })
</script>

<template>
  <mono-card bordered width="100%" style="--mono-card-padding: 0; overflow: hidden;">
    <div class="example-toolbar">
      <div class="example-hint">
        <strong>Click any cell</strong> to edit, then move with the keyboard. The grid is
        12 columns wide on purpose — navigating past the edge scrolls it into view, and the
        pinned <code>ID</code> column never covers where you land.
      </div>
      <div class="example-actions">
        <span v-show="pending" class="example-pending">{{ pending }} pending</span>
        <mono-button size="sm" variant="outline" color="neutral" :disabled="!table.hasChanges()"
          @click="table.discardChanges()">Discard</mono-button>
      </div>
    </div>

    <div class="example-legend">
      <div class="example-keys">
        <div><kbd>Tab</kbd> <span>next column — rolls into the next row at the end</span></div>
        <div><kbd>Shift</kbd>+<kbd>Tab</kbd> <span>previous column</span></div>
        <div><kbd>Tab</kbd>+<kbd>←</kbd>/<kbd>→</kbd> <span>column, <em>same row</em> — stops at the edges</span></div>
        <div><kbd>Tab</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> <span><em>same column</em>, row up / down — stops at the first / last row</span></div>
        <div><kbd>←</kbd> <kbd>→</kbd> alone <span>still move the caret inside the editor</span></div>
        <div><kbd>Enter</kbd> <span>open the focused editor — try it on <em>Unit</em>, <em>Warehouse</em> or a date</span></div>
        <div><kbd>Esc</kbd> <span>close that popup, or leave edit mode when none is open</span></div>
      </div>
      <div class="example-readout">
        <div><span>last keys</span><strong>{{ lastKeys }}</strong></div>
        <div><span>row</span><strong data-kn="row">{{ at.row }}</strong></div>
        <div><span>column</span><strong data-kn="field">{{ at.field }}</strong></div>
        <div><span>scrollLeft</span><strong data-kn="scroll">{{ scrollLeft }}px</strong></div>
      </div>
    </div>

    <div ref="scrollerEl" mono-table-scroll class="example-scroll" @scroll="scrollLeft = Math.round($event.target.scrollLeft)">
      <!-- sticky-head so the column you're navigating to stays labelled while the
           rows scroll under it — and so the reveal has a header band to avoid. -->
      <table mono-table mono-fixed mono-sticky-head @keydown="onKeydown" @keyup="onKeyup">
        <thead>
          <tr>
            <th mono-sticky-left class="example-id">
              <mono-table-th :control-table.prop="table" field="id" caption="ID" :width="56">ID</mono-table-th>
            </th>
            <th v-for="col in COLUMNS" :key="col.field">
              <mono-table-th :control-table.prop="table" :field="col.field" :caption="col.caption"
                :editable="true" :width="col.width">{{ col.caption }}</mono-table-th>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.id" :data-row-key="rk(row)"
            :mono-editing="table.isEditingRow(rk(row)) ? '' : null">
            <td mono-sticky-left class="example-id">{{ row.id }}</td>

            <td v-for="col in COLUMNS" :key="col.field">
              <template v-if="table.isEditingCell(rk(row), col.field)">
                <mono-select v-if="col.editor === 'select'" size="sm" :data-edit-cell="col.field"
                  :items.prop="col.options.value" key-value="value" display-value="label"
                  :model-value="table.cellValue(rk(row), col.field, row[col.field])"
                  @change="e => table.stageCell(rk(row), col.field, e.detail.modelValue)"
                  @keydown="e => table.editorKeydown(e, rk(row), col.field)" />
                <mono-date v-else-if="col.editor === 'date'" size="sm" :data-edit-cell="col.field"
                  :model-value="String(table.cellValue(rk(row), col.field, row[col.field]) ?? '')"
                  @change="e => table.stageCell(rk(row), col.field, e.detail.modelValue)"
                  @keydown="e => table.editorKeydown(e, rk(row), col.field)" />
                <mono-input v-else size="sm" :data-edit-cell="col.field"
                  :type="col.editor === 'number' ? 'number' : 'text'"
                  :model-value="String(table.cellValue(rk(row), col.field, row[col.field]) ?? '')"
                  @change="e => table.stageCell(rk(row), col.field, col.editor === 'number' ? Number(e.detail.modelValue) : e.detail.modelValue)"
                  @keydown="e => table.editorKeydown(e, rk(row), col.field)" />
              </template>
              <span v-else>{{ displayOf(row, col) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-hint {
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
  max-width: 40rem;
}

.example-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.example-pending {
  font-size: 0.74rem;
  opacity: 0.7;
}

.example-legend {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1rem;
  padding: 0 1rem 0.75rem;
}

.example-keys {
  display: grid;
  gap: 0.28rem;
  font-size: 0.75rem;
  opacity: 0.85;
}

.example-keys span {
  opacity: 0.75;
}

.example-keys em {
  font-style: normal;
  font-weight: 700;
}

.example-keys kbd {
  display: inline-block;
  min-width: 1.2rem;
  padding: 0.05rem 0.35rem;
  text-align: center;
  font-family: inherit;
  font-size: 0.72rem;
  border: 1px solid var(--border);
  border-bottom-width: 2px;
  border-radius: 0.3rem;
  background: var(--muted);
}

.example-readout {
  display: grid;
  gap: 0.2rem;
  align-content: start;
  font-size: 0.74rem;
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem;
  background: var(--muted);
}

.example-readout div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.example-readout span {
  opacity: 0.6;
}

.example-readout strong {
  font-variant-numeric: tabular-nums;
}

/* A width the 12 columns must overflow, so the scrollbar is always in play. */
.example-scroll {
  --mono-table-sticky-left: 0px;
  max-height: 22rem;
}

.example-id {
  width: 56px;
}

@media (max-width: 720px) {
  .example-legend {
    grid-template-columns: 1fr;
  }
}
</style>
