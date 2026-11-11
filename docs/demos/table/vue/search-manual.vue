<script setup lang="ts">
import { ref, computed } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'

type Row = { Id: number; Code: string; Nama: string }

const ROWS: Row[] = [
  { Id: 1, Code: 'TMM', Nama: 'Trade Marketing' },
  { Id: 2, Code: 'SLS', Nama: 'Sales' },
  { Id: 3, Code: 'MKT', Nama: 'Marketing' },
  { Id: 4, Code: 'MPE', Nama: 'Marketplace' },
  { Id: 5, Code: 'MRS', Nama: 'Market Research' },
  { Id: 6, Code: 'DSC', Nama: 'Demand Supply Customer' },
]

// Passing :model-value is what makes the box MANUAL: it only emits input / change /
// clear, and the search below is entirely ours — no controller involved.
const q = ref('')
const log = ref<string[]>([])

const rows = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return ROWS
  return ROWS.filter((r) => r.Code.toLowerCase().includes(term) || r.Nama.toLowerCase().includes(term))
})

function onEvent(e: CustomEvent) {
  q.value = e.detail.modelValue ?? ''
  log.value = [`[${e.type}] modelValue="${e.detail.modelValue}" old="${e.detail.oldValue}"`, ...log.value].slice(0, 8)
}
</script>

<template>
  <div style="width: 100%;">
    <mono-card bordered width="100%" class="example-card">
      <div class="example-toolbar">
        <mono-table-search
          :model-value="q"
          clearable
          placeholder="Search code or name…"
          helper-text="Filtered locally from @input — the box never touches a grid"
          @input="onEvent"
          @change="onEvent"
          @clear="onEvent"
          data-search />
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

    <br>
    <DemoLog :lines="log" />
  </div>
</template>

<style scoped>
.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}
.example-toolbar {
  padding: 0.9rem 1rem;
  max-width: 360px;
}
</style>
