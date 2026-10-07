<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

type Employee = {
  Id: number
  Name: string
  Dept: string
  Salary: number
  Bonus: number
  JoinedAt: string
}

const employees: Employee[] = [
  { Id: 1, Name: 'Alice Rahman', Dept: 'Engineering', Salary: 5000, Bonus: 500, JoinedAt: '2022-03-14' },
  { Id: 2, Name: 'Budi Santoso', Dept: 'Operations', Salary: 3200, Bonus: 0, JoinedAt: '2021-11-02' },
  { Id: 3, Name: 'Cara Lim', Dept: 'Engineering', Salary: 4100, Bonus: 250, JoinedAt: '2023-01-20' },
  { Id: 4, Name: 'Dani Putra', Dept: 'Operations', Salary: 2800, Bonus: 100, JoinedAt: '2023-06-08' },
  { Id: 5, Name: 'Eka Wijaya', Dept: 'Finance', Salary: 6100, Bonus: 900, JoinedAt: '2020-09-30' },
  { Id: 6, Name: 'Fajar Nugroho', Dept: 'Finance', Salary: 4700, Bonus: 350, JoinedAt: '2022-07-11' },
]

// The template is Markdown. In a real app: import md from './payroll.md?raw'
const template = `# Payroll Report

**{{company}}** — {{total}} employees

| Employee | Department | Salary | Bonus | Take home |
|----------|------------|--------|-------|-----------|
{{#each rows}}
| {{Name}} | {{Dept}} | {{currency Salary}} | {{currency Bonus}} | {{currency (add Salary Bonus)}} |
{{/each}}
| {{rowStyle "total"}}**Total** | | {{currency (sum rows "Salary")}} | {{currency (sum rows "Bonus")}} | {{formula "SUM(E{firstRow}:E{prevRow})"}} |

> Average salary {{currency (avg rows "Salary")}} · highest {{currency (max rows "Salary")}}.
`

// Paged 3-per-page on purpose: the report still covers all 6 rows.
const table = controlMonoTable<Employee>(employees, { pageSize: 3, keyExpr: 'Id' })

const rows = ref<Employee[]>([])
const busy = ref(false)

const off = table.subscribe(() => {
  rows.value = [...table.items]
})

onMounted(() => table.load())
onBeforeUnmount(() => {
  off()
  table.dispose()
})

async function downloadExcel() {
  busy.value = true
  try {
    // The template only ever sees what's in `data`. `getData()` returns every
    // matching row — not just the page on screen — without disturbing the grid.
    await table.export({
      md: template,
      fileName: 'payroll.xlsx',
      data: {
        rows: await table.getData(),
        total: table.totalCount,
        company: 'PT Mono Sejahtera',
      },
      helpers: { add: (a: number, b: number) => Number(a) + Number(b) },
      formatting: { locale: 'id-ID', currency: 'IDR' },
      freezeRows: 4,
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">Payroll</strong>

      <mono-button size="sm" color="primary" :loading.prop="busy" @click="downloadExcel">
        Download .xlsx
      </mono-button>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Bonus</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td>{{ row.Name }}</td>
            <td>{{ row.Dept }}</td>
            <td>{{ row.Salary.toLocaleString('id-ID') }}</td>
            <td>{{ row.Bonus.toLocaleString('id-ID') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
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
  flex-wrap: wrap;
}

.example-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

</style>
