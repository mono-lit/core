<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/card'
import { controlMonoTable, monoArraySource } from '@mono-lit/helper'

type Row = { Id: number; Code: string; Nama: string }

const ROWS: Row[] = [
  { Id: 1, Code: 'TMM', Nama: 'Trade Marketing' },
  { Id: 2, Code: 'SLS', Nama: 'Sales' },
  { Id: 3, Code: 'MKT', Nama: 'Marketing' },
  { Id: 4, Code: 'MPE', Nama: 'Marketplace' },
  { Id: 5, Code: 'MRS', Nama: 'Market Research' },
  { Id: 6, Code: 'DSC', Nama: 'Demand Supply Customer' },
]

// mono-table-search takes mono-input's appearance props, so the same values can
// drive both controls below — that side-by-side is the whole point of the demo.
const size = ref('md')
const color = ref('primary')
const variant = ref('outlined')
const clearable = ref(true)

const table = controlMonoTable<Row>(null, { searchValue: ['Code', 'Nama'], pageSize: 10 })
const rows = ref<Row[]>([])

const off = table.subscribe(() => { rows.value = [...table.items] })
table.bind(monoArraySource(ROWS, { pageSize: 10 }))
void table.load()

onBeforeUnmount(() => { off(); table.dispose() })
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="size" label="Size" :options="['xs', 'sm', 'md', 'lg', 'xl']" data-size-picker />
      <DemoSelect v-model="color" label="Color" colors="form" data-color-picker />
      <DemoSelect v-model="variant" label="Variant" :options="['outlined', 'filled', 'underlined']" data-variant-picker />
      <DemoCheck v-model="clearable" label="clearable" data-clearable-picker />
    </DemoControls>

    <mono-card bordered width="100%" class="example-card">
      <!-- The search and a plain mono-input, same props — they should look identical. -->
      <div class="example-pair">
        <mono-table-search
          :control-table.prop="table"
          :size="size" :color="color" :variant="variant" :clearable.prop="clearable"
          label="Table search"
          helper-text="Filters Code and Nama"
          placeholder="Search code or name…"
          data-search />

        <mono-input
          :size="size" :color="color" :variant="variant" :clearable.prop="clearable"
          label="A plain mono-input"
          helper-text="For comparison only"
          placeholder="Same props…"
          data-plain />
      </div>

      <div mono-table-scroll>
        <table mono-table>
          <thead>
            <tr><th>Id</th><th>Code</th><th>Name</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.Id">
              <td>{{ row.Id }}</td>
              <td>{{ row.Code }}</td>
              <td>{{ row.Nama }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!rows.length" mono-table-empty>
        <div mono-empty-title>No matches</div>
      </div>
    </mono-card>
  </div>
</template>

<style scoped>
.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}
.example-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  padding: 0.9rem 1rem;
}
</style>
