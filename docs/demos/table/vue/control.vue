<script setup>
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

const data = ref([
  { id: 1, code: 'AX-100', name: 'Ada Lovelace', qty: 12, price: 15000 },
  { id: 2, code: 'BK-101', name: 'Alan Turing', qty: 5, price: 42000 },
  { id: 3, code: 'CM-102', name: 'Grace Hopper', qty: 9, price: 27500 },
  { id: 4, code: 'DR-103', name: 'Katherine J.', qty: 21, price: 8000 },
  { id: 5, code: 'EN-104', name: 'Edsger Dijkstra', qty: 3, price: 96000 },
  { id: 6, code: 'FT-105', name: 'Barbara Liskov', qty: 17, price: 12500 },
])

// The grid writes a props() snapshot here on every change, so the header loop
// below is reactive with no manual subscription.
const state = ref({})

const table = controlMonoTable(data.value, {
  keyExpr: 'id',
  pageSize: 4,
  searchValue: ['code', 'name'],
  state,
  // EVERY mono-table-* prop declared once, centrally. The elements below carry
  // nothing but :control-table.prop (and `field`, which is their identity).
  props: {
    th: [
      { field: 'code', caption: 'Kode', width: '8rem', sort: true },
      { field: 'name', caption: 'Nama', editable: true, sort: { order: 'asc' } },
      { field: 'qty', caption: 'Qty', width: '6rem', editable: true, sort: true, summary: { type: 'sum' } },
      { field: 'price', caption: 'Harga', width: '9rem', editable: true, summary: { type: 'avg' } },
    ],
    search: { placeholder: 'Cari kode atau nama…', debounce: 200 },
    info: { template: 'Baris {from}–{to} dari {total}' },
    paging: { siblings: 2 },
    pageSize: { sizes: [4, 8, 12], label: 'Per halaman' },
  },
})



const rows = ref([])
const off = table.subscribe(() => { rows.value = [...table.items] })
table.load()

const money = (n) => new Intl.NumberFormat('id-ID').format(n ?? 0)

// `props.th` is a plain list — toggling a column on/off is just add/remove.
const hasTotal = ref(false)
function toggleColumn() {
  const th = table.props().th
  const i = th.findIndex((c) => c.field === 'total')
  if (i >= 0) {
    th.splice(i, 1)
    hasTotal.value = false
  } else {
    th.push({ field: 'total', caption: 'Total', width: '9rem' })
    hasTotal.value = true
  }
  table.reload()
}

onBeforeUnmount(() => { off(); table.dispose() })
</script>

<template>
  <mono-card bordered width="100%" style="--mono-card-padding: 0; overflow: hidden;">
    <div class="example-toolbar">
      <div class="example-hint">
        Every element below is wired with <strong>only</strong>
        <code>:control-table.prop</code> — the placeholder, info template, page sizes,
        captions, widths, sort and summaries all come from
        <code>controlMonoTable({ props })</code>. The header is looped by hand from
        <code>state.th</code>.
      </div>

      <mono-button v-if="hasTotal" size="sm" variant="outline" color="primary" data-add-col
        @click="toggleColumn">Hapus Kolom</mono-button>
      <mono-button v-else size="sm" variant="outline" color="primary" data-add-col
        @click="toggleColumn">Tambah Kolom</mono-button>


    </div>

    <div class="example-bar">
      <mono-table-search :control-table.prop="table" />
      <mono-table-page-size :control-table.prop="table" />
    </div>

    <div mono-table-scroll>
      <table mono-table mono-fixed>
        <thead>
          <tr>
            <!-- Manual loop — the library never renders this for you. -->
            <th v-for="c in state.th" :key="c.field">
              <mono-table-th :control-table.prop="table" :field="c.field" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" :data-row-key="String(row.id)">
            <td>{{ row.code }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.qty }}</td>
            <td>{{ money(row.price) }}</td>
            <td v-if="hasTotal">{{ money(row.qty * row.price) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            <td class="example-foot-label">Total / rata-rata</td>
            <!-- field is the identity; type comes from th[].summary -->
            <td><mono-table-summary :control-table.prop="table" field="qty" /></td>
            <td><mono-table-summary :control-table.prop="table" field="price" /></td>
            <td v-if="hasTotal"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; padding: 0.72rem 1rem; flex-wrap: wrap;
}
.example-hint { font-size: 0.8rem; opacity: 0.75; max-width: 42rem; }
.example-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; padding: 0 1rem 0.75rem; flex-wrap: wrap;
}
.example-foot-label { font-size: 0.75rem; opacity: 0.7; text-align: right; }
</style>
