<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/filter'
import '@mono-lit/helper/ui/card'
import { controlMonoTable, monoArraySource } from '@mono-lit/helper'

type Row = { Id: number; Code: string; Nama: string; Kota: string }

const ROWS: Row[] = [
  { Id: 1, Code: 'TMM', Nama: 'Andy Wijaya', Kota: 'Jakarta' },
  { Id: 2, Code: 'SLS', Nama: 'Budi Santoso', Kota: 'Bandung' },
  { Id: 3, Code: 'MKT', Nama: 'Citra Dewi', Kota: 'Jakarta' },
  { Id: 4, Code: 'MPE', Nama: 'Andy Kurnia', Kota: 'Surabaya' },
  { Id: 5, Code: 'MRS', Nama: 'Dewi Lestari', Kota: 'Bandung' },
  { Id: 6, Code: 'DSC', Nama: 'Budi Rahardjo', Kota: 'Jakarta' },
]

// The grid OWNS the filter builder — `table.filterBuilder` is what the slotted
// <mono-filter-builder> binds. `dataGrid` is wired automatically, so the field
// list is derived from the registered <mono-table-th> columns (Code/Nama/Kota).
const table = controlMonoTable<Row>(null, {
  searchValue: ['Code', 'Nama', 'Kota'],
  pageSize: 10,
  filterBuilder: {
    fields: [
      { field: 'Code', caption: 'Code' },
      { field: 'Nama', caption: 'Name' },
      { field: 'Kota', caption: 'City' },
    ],
  },
})

const rows = ref<Row[]>([])
const filterString = ref('')

const offTable = table.subscribe(() => {
  rows.value = [...table.items]
})
// Live OData preview of the builder's current (possibly un-applied) edits.
const offFilter = table.filterBuilder?.subscribe(() => {
  filterString.value = String(table.filterBuilder?.changed({ type: 'string' }) ?? '')
})

table.bind(monoArraySource(ROWS, { pageSize: 10, searchValue: ['Code', 'Nama', 'Kota'] }))
void table.load()

onBeforeUnmount(() => {
  offTable()
  offFilter?.()
  table.dispose()
})
</script>

<template>
  <div style="width: 100%;">
    <mono-card bordered width="100%" class="example-card">
      <mono-table-search
        :control-table.prop="table"
        suggestion
        multi-context
        :max-chips="1"
        filter-label="Filter"
        placeholder="Search, or use the filter builder…"
        helper-text="The chevron opens the filter builder — Apply filters the grid (and chips it)."
        data-search>
        <mono-filter-builder
          slot="filter-builder"
          :control-filter-builder.prop="table.filterBuilder"
          size="md"
          width="34rem"
          max-height="18rem"
          data-builder />
      </mono-table-search>

      <div class="example-filter" control-filter-builder>{{ filterString || '(no filter)' }}</div>

      <div mono-table-scroll>
        <table mono-table>
          <thead>
            <tr>
              <th>Id</th>
              <th><mono-table-th :control-table.prop="table" field="Code" caption="Code" /></th>
              <th><mono-table-th :control-table.prop="table" field="Nama" caption="Name" /></th>
              <th><mono-table-th :control-table.prop="table" field="Kota" caption="City" /></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.Id">
              <td>{{ row.Id }}</td>
              <td>{{ row.Code }}</td>
              <td>{{ row.Nama }}</td>
              <td>{{ row.Kota }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!rows.length" mono-table-empty>
        <div mono-empty-title>No matches</div>
        <div class="mono-table-empty-text">Widen the search or clear the filter.</div>
      </div>
    </mono-card>
  </div>
</template>

<style scoped>
.example-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.example-filter {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  word-break: break-all;
  padding: 0.5rem 0.65rem;
  border-radius: 0.4rem;
  background: var(--muted);
  color: var(--muted-foreground);
}
</style>
