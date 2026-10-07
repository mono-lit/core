<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import { controlMonoTable, type MonoDisplayRow } from '@mono-lit/helper'

type EmployeeRow = { Id: number; Code: string; Nama: string; Dept: string }

// A flat array (no server). Several rows per department so the per-group pager
// is useful. The main pager pages the DEPARTMENT groups; each group's rows are
// paged independently by its own <mono-table-paging-group>.
const departments = ['Community Demand & Beauty', 'Marketing', 'Marketplace', 'Sales', 'Trade Marketing']
const codes = ['CBD', 'MKT', 'MPE', 'SLS', 'TMM']
const data: EmployeeRow[] = []
let id = 1
departments.forEach((dept, d) => {
  const n = 4 + ((d * 3) % 5)
  for (let i = 0; i < n; i++) {
    data.push({ Id: id++, Code: `${codes[d]}-${String(i + 1).padStart(2, '0')}`, Nama: `${dept} member ${i + 1}`, Dept: dept })
  }
})

// Pass the array straight in — controlMonoTable groups + pages it in memory.
const table = controlMonoTable<EmployeeRow>(data, {
  group: ['Dept'],
  pageSize: 3, // departments (groups) per page
  groupRowPageSize: 3, // rows per department page
  searchValue: ['Code', 'Nama', 'Dept'],
})

const rows = ref<MonoDisplayRow<EmployeeRow>[]>([])
const off = table.subscribe(() => { rows.value = table.displayRows })

onMounted(() => void table.load())
onBeforeUnmount(() => { off(); table.dispose() })
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">Members — group + per-group paging</strong>

      <div class="example-toolbar-right">
        <mono-button size="xs" variant="ghost" @click="table.expandAllGroups()">Expand all</mono-button>
        <mono-button size="xs" variant="ghost" @click="table.collapseAllGroups()">Collapse all</mono-button>
        <mono-table-search :control-table.prop="table" placeholder="Search…" />
      </div>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th><mono-table-sort :control-table.prop="table" field="Id">Id</mono-table-sort></th>
            <th><mono-table-sort :control-table.prop="table" field="Code">Code</mono-table-sort></th>
            <th><mono-table-sort :control-table.prop="table" field="Nama">Name</mono-table-sort></th>
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

            <tr v-else-if="item.kind === 'footer'" mono-group-foot-row>
              <td colspan="3" mono-group-foot :style="{ '--mono-table-group-level': item.level }">
                <mono-table-paging-group :control-table.prop="table" :group.prop="item.node!.path" page-size="3" />
              </td>
            </tr>

            <tr v-else>
              <td>{{ item.row!.Id }}</td>
              <td><mono-chip size="xs" color="primary" variant="soft">{{ item.row!.Code }}</mono-chip></td>
              <td>{{ item.row!.Nama }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <div class="example-footer-left">
        <mono-table-page-size :control-table.prop="table" :sizes.prop="[2, 3, 5, 'all']" label="Groups:" />
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
</style>
