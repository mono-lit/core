<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoDataDropdown } from '@mono-lit/helper'

type Person = { Id: number; Name: string; Team: string }

// Must match the `row-height` below AND the pinned CSS height on the data cells,
// or the window math and the spacer heights drift apart.
const ROW_HEIGHT = 36

const TEAMS = ['Platform', 'Frontend', 'Design', 'Data', 'Mobile']
// 10,000 rows — only the ~visible slice is ever in the DOM.
const people: Person[] = Array.from({ length: 10000 }, (_, i) => ({
  Id: i + 1,
  Name: `Member ${String(i + 1).padStart(5, '0')}`,
  Team: TEAMS[i % TEAMS.length],
}))

const dd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 200,
  searchValue: ['Name', 'Team'],
})

// In virtual mode `grid.items` is ALREADY the windowed slice; the spacer heights
// come from the controller as virtualPadTop / virtualPadBottom.
const rows = ref<Person[]>([])
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
dd.table.load()

const selected = ref<number | null>(null)

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <mono-dropdown-table :control-data-dropdown.prop="dd" label="Owner" placeholder="Pick a person…"
      clearable helper-text="10,000 rows — only the visible ones are in the DOM."
      :dropdown.prop="{ width: 420, maxHeight: 300 }"
      :model-value="selected" @change="selected = $event.detail.modelValue">
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search name or team…" />

      <!-- Windowed rendering inside the panel body (the scroll container): a top
           spacer <tr>, only the visible rows, then a bottom spacer <tr>. The
           spacers are sized from the controller so the scrollbar reflects every
           loaded row while the DOM stays tiny. Spacers carry no data-row-key, so
           they are never selectable. -->
      <table mono-table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Team</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="padTop" :style="{ height: padTop + 'px' }" aria-hidden="true">
            <td colspan="2"></td>
          </tr>

          <tr v-for="r in rows" :key="r.Id" class="example-vs-row" :data-row-key="String(r.Id)">
            <td>{{ r.Name }}</td>
            <td>
              <mono-chip size="xs" color="primary" variant="soft">{{ r.Team }}</mono-chip>
            </td>
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
  max-width: 420px;
}
.example-value {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
/* Keep the header row visible while the panel body scrolls. */
thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--background);
}
/* Pin the DATA rows to exactly ROW_HEIGHT so the window math and spacer heights
   line up. Scoped to .example-vs-row so the spacer rows keep their computed height. */
.example-vs-row td {
  height: 36px;
  padding-top: 0;
  padding-bottom: 0;
  box-sizing: border-box;
}
</style>
